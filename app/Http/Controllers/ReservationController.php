<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReservationRequest;
use App\Models\Client;
use App\Models\Reservation;
use App\Notifications\ReservationAnnulee;
use App\Notifications\ReservationValidee;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class ReservationController extends Controller
{
    /**
     * Store a newly created reservation, en refusant tout chevauchement de dates
     * sur le même appartement (statuts en_attente/validee uniquement).
     */
    public function store(StoreReservationRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $chevauchement = Reservation::overlapping($data['appartement_id'], $data['date_debut'], $data['date_fin'])
            ->exists();

        if ($chevauchement) {
            return back()->withErrors([
                'date_debut' => 'Cet appartement est déjà réservé sur cette période.',
            ])->withInput();
        }

        DB::transaction(function () use ($data) {
            $clientId = $data['client_id'] ?? Client::create($data['client'])->id;

            Reservation::create([
                'appartement_id' => $data['appartement_id'],
                'client_id' => $clientId,
                'date_debut' => $data['date_debut'],
                'date_fin' => $data['date_fin'],
                'statut' => $data['statut'],
            ]);
        });

        return back();
    }

    /**
     * Confirme ou annule une réservation en attente (le seul état de départ autorisé —
     * une réservation déjà validée/annulée/terminée ne peut plus changer d'état ici).
     */
    public function updateStatut(Request $request, Reservation $reservation): RedirectResponse
    {
        $data = $request->validate([
            'statut' => ['required', 'in:validee,annulee'],
        ]);

        if ($reservation->statut !== 'en_attente') {
            return back()->withErrors([
                'statut' => "Seule une réservation en attente peut être confirmée ou annulée.",
            ]);
        }

        $reservation->update(['statut' => $data['statut']]);
        $reservation->load(['appartement', 'client']);

        if ($reservation->client->email) {
            $notification = $data['statut'] === 'validee'
                ? new ReservationValidee($reservation)
                : new ReservationAnnulee($reservation);

            Notification::route('mail', $reservation->client->email)->notify($notification);
        }

        return back();
    }
}
