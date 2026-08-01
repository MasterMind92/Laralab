<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReservationRequest;
use App\Models\Client;
use App\Models\Reservation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class ReservationController extends Controller
{
    /**
     * Store a newly created reservation, en refusant tout chevauchement de dates
     * sur le même appartement (statuts en_attente/validee uniquement).
     */
    public function store(StoreReservationRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $chevauchement = Reservation::query()
            ->where('appartement_id', $data['appartement_id'])
            ->whereIn('statut', ['en_attente', 'validee'])
            ->where('date_debut', '<', $data['date_fin'])
            ->where('date_fin', '>', $data['date_debut'])
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
}
