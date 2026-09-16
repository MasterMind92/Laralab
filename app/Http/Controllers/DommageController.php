<?php

namespace App\Http\Controllers;

use App\Models\Dommage;
use App\Models\Equipement;
use App\Models\Sejour;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DommageController extends Controller
{
    /**
     * Ajoute un dommage à un séjour (déjà clôturé ou non) — indépendant de l'assistant
     * de check-out, pour couvrir un dommage constaté ou oublié après coup, jusqu'à la
     * génération du devis.
     */
    public function store(Request $request, Sejour $sejour): RedirectResponse
    {
        $data = $request->validate([
            'equipement_id' => ['nullable', 'integer'],
            'description' => ['required', 'string', 'max:255'],
            'montant' => ['nullable', 'numeric', 'min:0'],
        ]);

        // Equipement n'a pas de scope automatique (catalogue global + lignes affectees
        // melanges) : whereHas('appartement') est le garde-fou manuel prescrit par le
        // modele, exists: ne suffit pas (ignore les global scopes, y compris celui-ci).
        if ($data['equipement_id'] ?? null) {
            Equipement::whereHas('appartement')->findOrFail($data['equipement_id']);
        }

        $sejour->dommages()->create($data);

        return back();
    }

    /**
     * Supprime (soft delete) un dommage — corrige une saisie erronée.
     */
    public function destroy(Dommage $dommage): RedirectResponse
    {
        $dommage->delete();

        return back();
    }
}
