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
        ]);

        ParametreFacturation::actuel()->update($data);

        return back();
    }
}
