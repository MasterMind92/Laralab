<?php

namespace App\Http\Controllers;

use App\Models\Partenaire;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PartenaireController extends Controller
{
    /**
     * Création à la volée depuis le formulaire de demande de service (pas de page de
     * gestion dédiée pour l'instant — hors périmètre du Round 2).
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'contact' => ['nullable', 'string', 'max:255'],
            'type_service' => ['nullable', 'string', 'max:255'],
        ]);

        Partenaire::create($data);

        return back();
    }
}
