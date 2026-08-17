<?php

namespace App\Http\Controllers;

use App\Models\ParametreFacturation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ParametreFacturationController extends Controller
{
    /**
     * Ligne unique de paramètres — pas de show/index séparé, edit() suffit.
     */
    public function edit(): Response
    {
        return Inertia::render('parametres-facturation/index', [
            'parametres' => ParametreFacturation::actuel(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'frais_service_actif' => ['required', 'boolean'],
            'taux_frais_service' => ['required', 'numeric', 'min:0', 'max:1'],
            'tva_active' => ['required', 'boolean'],
            'taux_tva' => ['required', 'numeric', 'min:0', 'max:1'],
            'depot_garantie_defaut' => ['required', 'numeric', 'min:0'],
            'delai_restitution_jours' => ['required', 'integer', 'min:0'],
            'acompte_actif' => ['required', 'boolean'],
        ]);

        ParametreFacturation::actuel()->update($data);

        return back();
    }
}
