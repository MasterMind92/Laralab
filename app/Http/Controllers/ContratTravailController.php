<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ExportsCsv;
use App\Models\Candidat;
use App\Models\ContratTravail;
use App\Models\Employe;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ContratTravailController extends Controller
{
    use ExportsCsv;

    private const TACHES_ONBOARDING = [
        'Compte utilisateur créé (accès système)',
        'Poste de travail / équipement remis',
        'Présentation à l\'équipe',
        'Documents administratifs signés',
        'Formation initiale effectuée',
    ];

    public function index(): Response
    {
        $candidatsAEmbaucher = Candidat::with('recrutement:id,poste')
            ->where('etape', 'embauche')
            ->where('statut', 'en_cours')
            ->whereDoesntHave('contratTravail')
            ->get(['id', 'recrutement_id', 'nom', 'prenom', 'salaire_propose']);

        return Inertia::render('rh/contrats', [
            'contrats' => ContratTravail::with('employe:id,nom,prenom')->orderByDesc('date_debut')->get(),
            'employes' => Employe::where('actif', true)->orderBy('nom')->get(['id', 'nom', 'prenom']),
            'candidatsAEmbaucher' => $candidatsAEmbaucher,
        ]);
    }

    /**
     * Contrat pour un employé déjà existant (renouvellement/avenant) — hors parcours recrutement.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'employe_id' => ['required', 'integer', 'exists:employes,id'],
            'type_contrat' => ['required', 'in:cdi,cdd,stage'],
            'salaire' => ['required', 'numeric', 'min:0'],
            'date_debut' => ['required', 'date'],
            'date_fin' => ['nullable', 'date', 'after:date_debut'],
            'fichier_contrat' => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:5120'],
        ]);

        ContratTravail::create([
            ...$data,
            'fichier_contrat' => $request->hasFile('fichier_contrat')
                ? $request->file('fichier_contrat')->store('contrats', 'public')
                : null,
        ]);

        return back();
    }

    public function update(Request $request, ContratTravail $contratTravail): RedirectResponse
    {
        $data = $request->validate([
            'type_contrat' => ['required', 'in:cdi,cdd,stage'],
            'salaire' => ['required', 'numeric', 'min:0'],
            'date_debut' => ['required', 'date'],
            'date_fin' => ['nullable', 'date', 'after:date_debut'],
        ]);

        $contratTravail->update($data);

        return back();
    }

    public function destroy(ContratTravail $contratTravail): RedirectResponse
    {
        $contratTravail->delete();

        return back();
    }

    /**
     * Embauche d'un candidat retenu (règle 4) : crée en une transaction l'Employe,
     * son ContratTravail (salaire = offre acceptée) et la checklist d'onboarding par
     * défaut. Refuse tout candidat qui n'a pas atteint l'étape offre acceptée.
     */
    public function embaucher(Request $request, Candidat $candidat): RedirectResponse
    {
        if ($candidat->etape !== 'embauche' || $candidat->statut !== 'en_cours') {
            return back()->withErrors(['candidat' => "Ce candidat n'a pas encore accepté d'offre."]);
        }

        $data = $request->validate([
            'type_contrat' => ['required', 'in:cdi,cdd,stage'],
            'date_debut' => ['required', 'date'],
        ]);

        DB::transaction(function () use ($candidat, $data, $request) {
            $employe = Employe::create([
                'user_id' => null,
                'nom' => $candidat->nom,
                'prenom' => $candidat->prenom,
                'poste' => $candidat->recrutement->poste,
                'date_embauche' => $data['date_debut'],
                'salaire_base' => $candidat->salaire_propose,
                'actif' => true,
            ]);

            $employe->contratsTravail()->create([
                'type_contrat' => $data['type_contrat'],
                'salaire' => $candidat->salaire_propose,
                'date_debut' => $data['date_debut'],
                'candidat_id' => $candidat->id,
                'embauche_par_id' => $request->user()->employe?->id,
            ]);

            foreach (self::TACHES_ONBOARDING as $i => $libelle) {
                $employe->onboardingTaches()->create(['libelle' => $libelle, 'ordre' => $i + 1]);
            }
        });

        return back();
    }

    public function export(Request $request): StreamedResponse
    {
        $data = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $contrats = ContratTravail::with('employe:id,nom,prenom')
            ->when($data['from'] ?? null, fn ($q, $from) => $q->whereDate('date_debut', '>=', $from))
            ->when($data['to'] ?? null, fn ($q, $to) => $q->whereDate('date_debut', '<=', $to))
            ->orderByDesc('date_debut')
            ->get();

        return $this->streamCsv(
            'contrats.csv',
            ['ID', 'Employé', 'Type', 'Salaire', 'Date début', 'Date fin'],
            $contrats->map(fn (ContratTravail $c) => [
                $c->id,
                $c->employe->nom.' '.$c->employe->prenom,
                $c->type_contrat,
                $c->salaire,
                $c->date_debut->toDateString(),
                $c->date_fin?->toDateString() ?? '',
            ]),
        );
    }
}
