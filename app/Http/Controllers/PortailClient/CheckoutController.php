<?php

namespace App\Http\Controllers\PortailClient;

use App\Http\Controllers\Controller;
use App\Models\Appartement;
use App\Models\ParametreFacturation;
use App\Models\Reservation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    /**
     * Affiche le récapitulatif de réservation : prix recalculé côté serveur
     * (jamais fait confiance au calcul client) et disponibilité revérifiée
     * (une réservation a pu être prise entre la fiche détail et ici).
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $appartement = Appartement::find($request->query('apt_id'));

        if (! $appartement) {
            return redirect()->route('list.appartement.client')
                ->withErrors(['appartement_id' => "Cet appartement n'existe pas ou plus."]);
        }

        $checkin = $request->query('checkin');
        $checkout = $request->query('checkout');
        $nights = 0;

        if ($checkin && $checkout && Carbon::parse($checkout)->gt(Carbon::parse($checkin))) {
            $nights = (int) Carbon::parse($checkin)->diffInDays(Carbon::parse($checkout));
        }

        $base = $nights * (float) $appartement->prix_nuit;
        $parametres = ParametreFacturation::actuel();
        $fee = $parametres->frais_service_actif ? round($base * (float) $parametres->taux_frais_service) : 0;

        $disponible = $appartement->statut_entretien === 'propre'
            && $nights > 0
            && ! Reservation::overlapping($appartement->id, $checkin, $checkout)->exists();

        $client = $request->user()->client;

        return Inertia::render('portail-client/CheckoutPage', [
            'appartement' => [
                'id' => $appartement->id,
                'titre' => $appartement->titre ?? $appartement->numero,
                'adresse' => $appartement->adresse,
                'photo' => $appartement->photosAffichables()[0] ?? null,
                'prix_nuit' => $appartement->prix_nuit,
            ],
            'checkin' => $checkin,
            'checkout' => $checkout,
            'guests' => $request->query('guests'),
            'nights' => $nights,
            'pricing' => [
                'base' => $base,
                'fee' => $fee,
                'total' => $base + $fee,
            ],
            'disponible' => $disponible,
            'client' => [
                'prenom' => $client->prenom ?? '',
                'nom' => $client->nom ?? '',
                'email' => $request->user()->email,
                'telephone' => $client->telephone ?? '',
            ],
            'confirmed' => (bool) session('reservation_confirmee'),
        ]);
    }
}
