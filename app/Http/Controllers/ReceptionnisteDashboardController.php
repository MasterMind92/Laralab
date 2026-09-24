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
 * Tableau de bord Réceptionniste — même schéma que MaintenanceController::dashboard() :
 * cartes KPI, répartition par statut, et la liste des demandes à traiter en priorité
 * (les plus anciennes d'abord). Les pannes signalées restent une visibilité inter-pôle
 * (c'est la Réception qui les déclare, voir InterventionController), pas une répartition
 * propre à ce pôle.
 */
class ReceptionnisteDashboardController extends Controller
{
    /** @var array<int, string> */
    private const STATUTS_RESERVATION = ['en_attente', 'validee', 'annulee', 'terminee'];

    public function index(): Response
    {
        $parStatut = Reservation::query()
            ->selectRaw('statut, COUNT(*) as total')
            ->groupBy('statut')
            ->pluck('total', 'statut');

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
            'parStatutReservation' => collect(self::STATUTS_RESERVATION)
                ->map(fn (string $statut) => ['statut' => $statut, 'total' => (int) ($parStatut[$statut] ?? 0)])
                ->values(),
            // Les plus anciennes d'abord : c'est le client qui attend depuis le plus longtemps.
            'demandesEnAttente' => DemandeService::where('statut', 'demandee')
                ->with(['appartement:id,numero', 'sejour.reservation.client:id,nom,prenom'])
                ->oldest()
                ->limit(8)
                ->get()
                ->map(fn (DemandeService $d) => [
                    'id' => $d->id,
                    'designation' => $d->designation,
                    'quantite' => $d->quantite,
                    'appartement' => $d->appartement ? ['numero' => $d->appartement->numero] : null,
                    'client' => $d->sejour?->reservation?->client
                        ? ['nom' => $d->sejour->reservation->client->nom, 'prenom' => $d->sejour->reservation->client->prenom]
                        : null,
                ])
                ->values(),
        ]);
    }
}
