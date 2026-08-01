<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\Sejour;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SejourController extends Controller
{
    /**
     * Effectue le check-in d'une réservation validée (création du séjour).
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'reservation_id' => ['required', 'integer', 'exists:reservations,id'],
        ]);

        $reservation = Reservation::findOrFail($data['reservation_id']);

        if ($reservation->statut !== 'validee') {
            return back()->withErrors([
                'reservation_id' => "Seule une réservation validée peut faire l'objet d'un check-in.",
            ]);
        }

        if ($reservation->sejour()->exists()) {
            return back()->withErrors([
                'reservation_id' => 'Cette réservation a déjà un séjour associé.',
            ]);
        }

        Sejour::create([
            'reservation_id' => $reservation->id,
            'date_entree' => now()->toDateString(),
            'statut' => 'en_cours',
        ]);

        return back();
    }
}
