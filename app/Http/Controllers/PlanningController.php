<?php

namespace App\Http\Controllers;

use App\Models\Appartement;
use App\Models\Client;
use App\Models\Reservation;
use Inertia\Inertia;
use Inertia\Response;

class PlanningController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('receptionniste/planning', [
            'appartements' => Appartement::orderBy('numero')->get(['id', 'numero', 'capacite', 'prix_nuit']),
            'clients' => Client::orderBy('nom')->get(['id', 'nom', 'prenom', 'telephone', 'email']),
            'reservations' => Reservation::with(['appartement:id,numero', 'client:id,nom,prenom', 'sejour:id,reservation_id,statut'])
                ->orderBy('date_debut')
                ->get(['id', 'appartement_id', 'client_id', 'date_debut', 'date_fin', 'statut']),
        ]);
    }
}
