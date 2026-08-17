<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePartenaireRequest;
use App\Models\Partenaire;
use Illuminate\Http\RedirectResponse;

class PartenaireController extends Controller
{
    /**
     * Création à la volée depuis le formulaire de demande de service (pas de page de
     * gestion dédiée pour l'instant — hors périmètre du Round 2).
     */
    public function store(StorePartenaireRequest $request): RedirectResponse
    {
        Partenaire::create($request->validated());

        return back();
    }
}
