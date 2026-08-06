<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\Sejour;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SejourController extends Controller
{
    /**
     * Effectue le check-in d'une réservation validée (création du séjour).
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'reservation_id' => ['required', 'integer', 'exists:reservations,id'],
            'etat_lieux_entree' => ['nullable', 'string'],
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
            'etat_lieux_entree' => $data['etat_lieux_entree'] ?? null,
            'statut' => 'en_cours',
        ]);

        return back();
    }

    /**
     * Clôture un séjour en cours (check-out) : état des lieux de sortie, dégâts
     * constatés, et fait passer la réservation associée à 'terminee'.
     */
    public function checkout(Request $request, Sejour $sejour): RedirectResponse
    {
        $data = $request->validate([
            'etat_lieux_sortie' => ['nullable', 'string'],
            'casses' => ['nullable', 'string'],
        ]);

        if ($sejour->statut !== 'en_cours') {
            return back()->withErrors([
                'sejour' => "Seul un séjour en cours peut faire l'objet d'un check-out.",
            ]);
        }

        DB::transaction(function () use ($sejour, $data) {
            $sejour->update([
                'date_sortie' => now()->toDateString(),
                'etat_lieux_sortie' => $data['etat_lieux_sortie'] ?? null,
                'casses' => $data['casses'] ?? null,
                'statut' => 'cloture',
            ]);

            $sejour->reservation->update(['statut' => 'terminee']);
        });

        return back();
    }
}
