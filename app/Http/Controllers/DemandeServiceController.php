<?php

namespace App\Http\Controllers;

use App\Models\DemandeService;
use App\Models\Sejour;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DemandeServiceController extends Controller
{
    /**
     * Enregistre une demande de service (commande d'article/nourriture/boisson...)
     * pour un séjour en cours.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'sejour_id' => ['required', 'integer', 'exists:sejours,id'],
            'designation' => ['required', 'string', 'max:255'],
            'quantite' => ['required', 'integer', 'min:1'],
            'prix_unitaire' => ['required', 'numeric', 'min:0'],
        ]);

        $sejour = Sejour::findOrFail($data['sejour_id']);

        if ($sejour->statut !== 'en_cours') {
            return back()->withErrors([
                'sejour_id' => "Seul un séjour en cours peut avoir de nouvelles demandes.",
            ]);
        }

        DemandeService::create([
            'sejour_id' => $sejour->id,
            'designation' => $data['designation'],
            'quantite' => $data['quantite'],
            'prix_unitaire' => $data['prix_unitaire'],
            'statut' => 'demandee',
        ]);

        return back();
    }

    /**
     * Marque une demande comme livrée.
     */
    public function update(DemandeService $demandeService): RedirectResponse
    {
        $demandeService->update(['statut' => 'livree']);

        return back();
    }
}
