<?php

namespace App\Http\Controllers;

use App\Models\Appartement;
use App\Models\Competence;
use App\Models\Employe;
use App\Models\Tache;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TacheController extends Controller
{
    /**
     * Vue journaliere de planification (Phase 11) : les taches du jour choisi (defaut
     * aujourd'hui), plus tout ce qu'il faut pour l'assignation manuelle cote frontend
     * (competences et planning hebdomadaire de chaque employe, et s'il est en conge ce
     * jour-la) — de simples indications affichees en badge, jamais un filtre qui
     * choisit a la place du RH.
     */
    public function index(Request $request): Response
    {
        $date = $request->query('date') ? Carbon::parse($request->query('date')) : now();

        $taches = Tache::with(['appartement:id,numero', 'employeAssigne:id,nom,prenom'])
            ->whereDate('date_prevue', $date)
            ->orderBy('date_prevue')
            ->get();

        $employes = Employe::where('actif', true)
            ->with('competences:id,libelle')
            ->orderBy('nom')
            ->get()
            ->map(fn (Employe $e) => [
                'id' => $e->id,
                'nom' => $e->nom,
                'prenom' => $e->prenom,
                'jours_travailles' => $e->jours_travailles,
                'competences' => $e->competences->pluck('libelle')->all(),
                'en_conge' => $e->conges()
                    ->where('statut', 'valide')
                    ->whereDate('date_debut', '<=', $date)
                    ->whereDate('date_fin', '>=', $date)
                    ->exists(),
            ]);

        return Inertia::render('rh/planification', [
            'date' => $date->toDateString(),
            'taches' => $taches,
            'appartements' => Appartement::orderBy('numero')->get(['id', 'numero']),
            'employes' => $employes,
            'competences' => Competence::orderBy('libelle')->get(['id', 'libelle']),
        ]);
    }

    /**
     * Creation manuelle — l'entretien courant qui n'est declenche par aucune
     * reservation (les deux taches auto-generees passent par Reservation/Sejour).
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'appartement_id' => ['required', 'integer', 'exists:appartements,id'],
            'type' => ['required', 'in:'.implode(',', Tache::TYPES)],
            'priorite' => ['required', 'in:basse,normale,haute'],
            'date_prevue' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        Tache::create([...$data, 'origine' => 'manuelle', 'statut' => 'a_faire']);

        return back();
    }

    /**
     * Assignation manuelle (Phase 11 — pas d'algorithme). null desassigne.
     */
    public function assigner(Request $request, Tache $tache): RedirectResponse
    {
        $data = $request->validate([
            'employe_assigne_id' => ['nullable', 'integer', 'exists:employes,id'],
        ]);

        $tache->update(['employe_assigne_id' => $data['employe_assigne_id'] ?? null]);

        return back();
    }

    /**
     * Transition generique du cycle, gardee par Tache::TRANSITIONS — meme forme que
     * MaintenanceController::changerEtape().
     */
    public function changerStatut(Request $request, Tache $tache): RedirectResponse
    {
        $data = $request->validate([
            'statut' => ['required', 'in:'.implode(',', Tache::STATUTS)],
        ]);

        if (! $tache->peutPasserA($data['statut'])) {
            throw ValidationException::withMessages([
                'statut' => "Transition impossible : une tache {$tache->statut} ne peut pas passer a {$data['statut']}.",
            ]);
        }

        $tache->update(['statut' => $data['statut']]);

        return back();
    }

    /**
     * Corrige une saisie erronee — uniquement avant que le travail soit engage.
     */
    public function destroy(Tache $tache): RedirectResponse
    {
        if ($tache->statut !== 'a_faire') {
            return back()->withErrors([
                'tache' => 'Seule une tache encore a faire peut être supprimée.',
            ]);
        }

        $tache->delete();

        return back();
    }
}
