<?php

namespace App\Http\Controllers;

use App\Models\Paiement;
use Inertia\Inertia;
use Inertia\Response;

class PaiementReservationController extends Controller
{
    /**
     * Paiements simulés (acompte ou totalité) perçus à la réservation sur le portail
     * client — lecture seule, déjà considérés reçus (voir PortailClient\ReservationController::store()).
     * Une fois le séjour clôturé et le devis généré, facture_id est renseigné sur la
     * même ligne (FactureController::generer()) : "rattaché" l'indique.
     */
    public function index(): Response
    {
        $paiements = Paiement::whereNotNull('reservation_id')
            ->with(['reservation.appartement:id,numero', 'reservation.client:id,nom,prenom'])
            ->orderByDesc('date_paiement')
            ->get();

        return Inertia::render('comptabilite/paiements-reservations', [
            'paiements' => $paiements->map(fn (Paiement $p) => [
                'id' => $p->id,
                'montant' => $p->montant,
                'mode_paiement' => $p->mode_paiement,
                'date_paiement' => $p->date_paiement->toDateTimeString(),
                'rattache' => $p->facture_id !== null,
                'reservation' => $p->reservation ? [
                    'id' => $p->reservation->id,
                    'appartement' => $p->reservation->appartement?->numero,
                    'client' => $p->reservation->client
                        ? $p->reservation->client->nom.' '.$p->reservation->client->prenom
                        : null,
                    'date_debut' => $p->reservation->date_debut->toDateString(),
                    'date_fin' => $p->reservation->date_fin->toDateString(),
                ] : null,
            ]),
        ]);
    }
}
