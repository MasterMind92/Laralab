<?php

namespace App\Http\Controllers;

use App\Models\Candidat;
use App\Models\Conge;
use App\Models\ContratTravail;
use App\Models\Employe;
use App\Models\Recrutement;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Tableau de bord RH — même schéma que MaintenanceController::dashboard() : des cartes
 * KPI, une répartition par statut sur un axe fixe, et une liste des dossiers à traiter
 * en priorité (les plus anciens d'abord), pas seulement des compteurs.
 */
class RhDashboardController extends Controller
{
    /** @var array<int, string> */
    private const STATUTS_RECRUTEMENT = ['brouillon', 'en_attente_validation', 'validee', 'rejetee', 'clos'];

    public function index(): Response
    {
        $parStatut = Recrutement::query()
            ->selectRaw('statut, COUNT(*) as total')
            ->groupBy('statut')
            ->pluck('total', 'statut');

        return Inertia::render('rh/dashboard', [
            'kpi' => [
                'recrutements_ouverts' => Recrutement::whereIn('statut', ['en_attente_validation', 'validee'])->count(),
                'candidats_en_pipeline' => Candidat::where('statut', 'en_cours')->count(),
                'conges_en_attente' => Conge::where('statut', 'demande')->count(),
                'contrats_bientot_echus' => ContratTravail::whereNotNull('date_fin')
                    ->whereBetween('date_fin', [now()->toDateString(), now()->addDays(30)->toDateString()])
                    ->count(),
                'employes_actifs' => Employe::where('actif', true)->count(),
            ],
            'parStatutRecrutement' => collect(self::STATUTS_RECRUTEMENT)
                ->map(fn (string $statut) => ['statut' => $statut, 'total' => (int) ($parStatut[$statut] ?? 0)])
                ->values(),
            // Les plus anciennes demandes d'abord : ce sont elles qui font le plus attendre l'employé.
            'congesEnAttente' => Conge::where('statut', 'demande')
                ->with('employe:id,nom,prenom')
                ->orderBy('date_debut')
                ->limit(8)
                ->get()
                ->map(fn (Conge $c) => [
                    'id' => $c->id,
                    'date_debut' => $c->date_debut?->toDateString(),
                    'date_fin' => $c->date_fin?->toDateString(),
                    'employe' => $c->employe ? ['nom' => $c->employe->nom, 'prenom' => $c->employe->prenom] : null,
                ])
                ->values(),
        ]);
    }
}
