<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ExportsCsv;
use App\Models\Employe;
use App\Models\Recrutement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RecrutementController extends Controller
{
    use ExportsCsv;

    public function index(): Response
    {
        return Inertia::render('rh/recrutements', [
            'recrutements' => Recrutement::withCount('candidats')->orderByDesc('created_at')->get(),
            'employes' => Employe::where('actif', true)->orderBy('nom')->get(['id', 'nom', 'prenom']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validatedData($request);

        Recrutement::create($data);

        return back();
    }

    public function update(Request $request, Recrutement $recrutement): RedirectResponse
    {
        if ($recrutement->statut !== 'brouillon') {
            return back()->withErrors(['recrutement' => "Seule une demande en brouillon peut être modifiée."]);
        }

        $recrutement->update($this->validatedData($request));

        return back();
    }

    /**
     * Détail d'un recrutement : le tableau Kanban des candidatures (une colonne par étape).
     */
    public function show(Recrutement $recrutement): Response
    {
        $recrutement->load([
            'candidats' => fn ($q) => $q->orderByDesc('created_at'),
            'candidats.entretiens' => fn ($q) => $q->orderBy('numero_tour'),
            'candidats.entretiens.intervieweurs:id,nom,prenom',
        ]);

        return Inertia::render('rh/recrutement-detail', [
            'recrutement' => $recrutement,
            'employes' => Employe::where('actif', true)->orderBy('nom')->get(['id', 'nom', 'prenom']),
        ]);
    }

    /**
     * brouillon -> en_attente_validation.
     */
    public function soumettre(Recrutement $recrutement): RedirectResponse
    {
        if ($recrutement->statut !== 'brouillon') {
            return back()->withErrors(['recrutement' => "Seule une demande en brouillon peut être soumise."]);
        }

        $recrutement->update(['statut' => 'en_attente_validation']);

        return back();
    }

    /**
     * en_attente_validation -> validee (visible sur le portail public).
     */
    public function valider(Request $request, Recrutement $recrutement): RedirectResponse
    {
        if ($recrutement->statut !== 'en_attente_validation') {
            return back()->withErrors(['recrutement' => "Seule une demande en attente de validation peut être validée."]);
        }

        $recrutement->update([
            'statut' => 'validee',
            'valide_par_id' => $request->user()->employe?->id,
            'date_validation' => now()->toDateString(),
            'motif_rejet' => null,
        ]);

        return back();
    }

    /**
     * en_attente_validation -> rejetee.
     */
    public function rejeter(Request $request, Recrutement $recrutement): RedirectResponse
    {
        if ($recrutement->statut !== 'en_attente_validation') {
            return back()->withErrors(['recrutement' => "Seule une demande en attente de validation peut être rejetée."]);
        }

        $data = $request->validate([
            'motif_rejet' => ['required', 'string', 'max:1000'],
        ]);

        $recrutement->update([
            'statut' => 'rejetee',
            'motif_rejet' => $data['motif_rejet'],
        ]);

        return back();
    }

    /**
     * validee -> clos : fige la "liste définitive" (règle 3). Refuse si des candidats
     * encore en_cours n'ont pas atteint une décision (retenu/offre/embauche ou rejete).
     */
    public function cloturer(Recrutement $recrutement): RedirectResponse
    {
        if ($recrutement->statut !== 'validee') {
            return back()->withErrors(['recrutement' => "Seul un recrutement validé peut être clôturé."]);
        }

        $enSuspens = $recrutement->candidats()
            ->where('statut', 'en_cours')
            ->whereIn('etape', ['recu', 'a_analyser', 'preselectionne', 'entretien', 'evaluation'])
            ->exists();

        if ($enSuspens) {
            return back()->withErrors(['recrutement' => "Tous les candidats doivent avoir une décision (retenu ou rejeté) avant de clôturer."]);
        }

        $recrutement->update(['statut' => 'clos']);

        return back();
    }

    public function export(Request $request): StreamedResponse
    {
        $data = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $recrutements = Recrutement::withCount('candidats')
            ->when($data['from'] ?? null, fn ($q, $from) => $q->whereDate('created_at', '>=', $from))
            ->when($data['to'] ?? null, fn ($q, $to) => $q->whereDate('created_at', '<=', $to))
            ->orderByDesc('created_at')
            ->get();

        return $this->streamCsv(
            'recrutements.csv',
            ['ID', 'Poste', 'Département', 'Statut', 'Priorité', 'Nb candidats', 'Créé le'],
            $recrutements->map(fn (Recrutement $r) => [
                $r->id,
                $r->poste,
                $r->departement,
                $r->statut,
                $r->priorite,
                $r->candidats_count,
                $r->created_at->toDateString(),
            ]),
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedData(Request $request): array
    {
        return $request->validate([
            'poste' => ['required', 'string', 'max:255'],
            'departement' => ['nullable', 'string', 'max:255'],
            'responsable_id' => ['nullable', 'integer', 'exists:employes,id'],
            'profil_recherche' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'competences' => ['nullable', 'array'],
            'competences.*' => ['string', 'max:100'],
            'nombre_postes' => ['required', 'integer', 'min:1'],
            'type_contrat_propose' => ['nullable', 'in:cdi,cdd,stage'],
            'date_souhaitee' => ['nullable', 'date'],
            'budget_min' => ['nullable', 'numeric', 'min:0'],
            'budget_max' => ['nullable', 'numeric', 'min:0', 'gte:budget_min'],
            'priorite' => ['required', 'in:basse,normale,haute'],
            'motif' => ['nullable', 'in:remplacement,creation_poste,renforcement_equipe'],
            'date_limite_candidature' => ['nullable', 'date'],
            'lieu' => ['nullable', 'string', 'max:255'],
        ]);
    }
}
