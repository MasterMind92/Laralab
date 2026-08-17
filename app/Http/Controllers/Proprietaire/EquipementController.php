<?php

namespace App\Http\Controllers\Proprietaire;

use App\Http\Controllers\Controller;
use App\Models\Equipement;
use Inertia\Inertia;
use Inertia\Response;

class EquipementController extends Controller
{
    /**
     * Equipement n'a volontairement pas de global scope (catalogue vs assigne,
     * voir app/Models/Equipement.php) — filtre manuel explicite ici, ->whereHas('appartement')
     * beneficie quand meme du scope automatique d'Appartement (Phase 09).
     */
    public function index(): Response
    {
        return Inertia::render('proprietaire/equipements', [
            'equipements' => Equipement::whereNotNull('appartement_id')
                ->whereHas('appartement')
                ->with([
                    'appartement:id,numero,titre',
                    'interventions' => fn ($q) => $q->latest('date_signalement')->limit(1),
                ])
                ->orderBy('nom')
                ->get(),
        ]);
    }
}
