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
 * Tableau de bord RH (Phase 07) : des compteurs ponctuels sur le pipeline de recrutement,
 * les congés et les contrats — pas de reporting agrégé, les écrans dédiés (Recrutements,
 * Candidats, Congés, Contrats) restent la seule source de détail.
 */
class RhDashboardController extends Controller
{
    public function index(): Response
    {
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
        ]);
    }
}
