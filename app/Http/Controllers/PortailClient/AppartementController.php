<?php

namespace App\Http\Controllers\PortailClient;

use App\Http\Controllers\Controller;
use App\Models\Appartement;
use Inertia\Inertia;
use Inertia\Response;

class AppartementController extends Controller
{
    /**
     * Catalogue public. Le filtrage (prix, destination, type, voyageurs) reste
     * client-side sur ce jeu de données complet, comme dans le gabarit d'origine.
     */
    public function index(): Response
    {
        $appartements = Appartement::orderBy('numero')->get()->map->pourPortail()->all();

        return Inertia::render('portail-client/ApartmentListPage', [
            'appartements' => $appartements,
        ]);
    }

    public function show(Appartement $appartement): Response
    {
        $appartement->load('equipements');

        $data = $appartement->pourPortail();
        $data['equipements'] = $appartement->equipements
            ->map(fn ($e) => ['id' => $e->id, 'nom' => $e->nom, 'icone' => $e->icone])
            ->all();

        return Inertia::render('portail-client/ApartmentDetailPage', [
            'appartement' => $data,
        ]);
    }
}
