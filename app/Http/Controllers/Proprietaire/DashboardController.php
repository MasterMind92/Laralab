<?php

namespace App\Http\Controllers\Proprietaire;

use App\Http\Controllers\Controller;
use App\Models\Appartement;
use App\Models\Equipement;
use App\Models\Paiement;
use App\Models\Reservation;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * KPI scopes a l'entreprise du proprietaire/gerant connecte — automatiquement
     * filtre par les global scopes (BelongsToEntreprise/ScopedThroughEntreprise,
     * Phase 09), aucun filtre manuel necessaire ici.
     */
    public function index(): Response
    {
        return Inertia::render('dashboard-proprietaire', [
            'kpi' => [
                'reservations_mois' => Reservation::whereMonth('date_debut', now()->month)
                    ->whereYear('date_debut', now()->year)
                    ->count(),
                'total_encaisse' => (float) Paiement::whereMonth('date_paiement', now()->month)
                    ->whereYear('date_paiement', now()->year)
                    ->sum('montant'),
                'appartements_en_maintenance' => Appartement::where('statut_entretien', 'en_maintenance')->count(),
                'equipements_en_panne' => Equipement::whereNotNull('appartement_id')
                    ->whereHas('appartement')
                    ->where('statut', 'en_panne')
                    ->count(),
            ],
        ]);
    }
}
