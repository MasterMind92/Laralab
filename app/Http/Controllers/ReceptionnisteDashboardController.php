<?php

namespace App\Http\Controllers;

use App\Models\DemandeService;
use App\Models\Dommage;
use App\Models\Intervention;
use App\Models\Reservation;
use App\Models\Sejour;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Tableau de bord Réceptionniste (Phase 07) : des compteurs ponctuels sur les
 * réservations, séjours, demandes de service et dommages — plus les pannes signalées,
 * visibilité inter-pôle utile puisque c'est la Réception qui les déclare (voir
 * InterventionController).
 */
class ReceptionnisteDashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('receptionniste/dashboard', [
            'kpi' => [
                'reservations_en_attente' => Reservation::where('statut', 'en_attente')->count(),
                'sejours_en_cours' => Sejour::where('statut', 'en_cours')->count(),
                'demandes_service_en_attente' => DemandeService::where('statut', 'demandee')->count(),
                'dommages_non_factures' => Dommage::whereHas(
                    'sejour',
                    fn ($q) => $q->whereDoesntHave('facture'),
                )->count(),
                'pannes_signalees' => Intervention::where('etape', 'signalee')->count(),
            ],
        ]);
    }
}
