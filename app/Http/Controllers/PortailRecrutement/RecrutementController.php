<?php

namespace App\Http\Controllers\PortailRecrutement;

use App\Http\Controllers\Controller;
use App\Models\Recrutement;
use Inertia\Inertia;
use Inertia\Response;

class RecrutementController extends Controller
{
    /**
     * Offres publiées : seul un recrutement validé est visible (un clos redevient invisible).
     */
    public function index(): Response
    {
        $recrutements = Recrutement::where('statut', 'validee')
            ->orderByDesc('created_at')
            ->get(['id', 'poste', 'departement', 'lieu', 'type_contrat_propose', 'nombre_postes', 'date_limite_candidature']);

        return Inertia::render('portail-recrutement/Liste', [
            'recrutements' => $recrutements,
        ]);
    }

    public function show(Recrutement $recrutement): Response
    {
        abort_unless($recrutement->statut === 'validee', 404);

        return Inertia::render('portail-recrutement/Detail', [
            'recrutement' => $recrutement->only([
                'id', 'poste', 'departement', 'lieu', 'description', 'profil_recherche',
                'competences', 'type_contrat_propose', 'nombre_postes', 'date_limite_candidature',
            ]),
        ]);
    }
}
