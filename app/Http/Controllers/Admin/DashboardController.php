<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Entreprise;
use App\Models\Paiement;
use App\Models\Reservation;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Vue plateforme de l'administrateur : contrairement au tableau de bord
     * Propriétaire/Gérant (App\Http\Controllers\Proprietaire\DashboardController),
     * les global scopes ne filtrent jamais un administrateur (User::TENANT_EXEMPT_ROLES),
     * donc une requête nue balaierait aussi bien les vraies entreprises que les données
     * orphelines historiques (entreprise_id = null, monde pré-Phase-09 encore présent
     * dans DemoSeeder). Chaque agrégat exclut donc explicitement les orphelins — la
     * vue plateforme, c'est les vraies entreprises, pas le décor de démo hérité.
     */
    public function index(): Response
    {
        $statuts = Entreprise::query()
            ->selectRaw('statut, count(*) as total')
            ->groupBy('statut')
            ->pluck('total', 'statut');

        $totalUtilisateurs = User::whereNotNull('entreprise_id')->count();

        $reservationsMois = Reservation::whereHas('appartement', fn ($q) => $q->whereNotNull('entreprise_id'))
            ->whereMonth('date_debut', now()->month)
            ->whereYear('date_debut', now()->year)
            ->count();

        // Même double chemin que le scope maison de Paiement (facture déjà générée,
        // ou acompte de réservation avant même qu'une facture n'existe) — jamais
        // appliqué automatiquement pour un administrateur, donc explicité ici.
        $caMois = (float) Paiement::whereMonth('date_paiement', now()->month)
            ->whereYear('date_paiement', now()->year)
            ->where(function ($query) {
                $query->whereHas('facture.sejour.reservation.appartement', fn ($q) => $q->whereNotNull('entreprise_id'))
                    ->orWhereHas('reservation.appartement', fn ($q) => $q->whereNotNull('entreprise_id'));
            })
            ->sum('montant');

        return Inertia::render('admin/dashboard', [
            'kpi' => [
                'entreprises_actives' => (int) ($statuts['active'] ?? 0),
                'entreprises_essai' => (int) ($statuts['essai'] ?? 0),
                'entreprises_suspendues' => (int) ($statuts['suspendue'] ?? 0),
                'total_utilisateurs' => $totalUtilisateurs,
                'reservations_mois' => $reservationsMois,
                'ca_mois' => $caMois,
            ],
            'entreprises' => Entreprise::avecCompteurs(),
        ]);
    }
}
