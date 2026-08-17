<?php

namespace App\Http\Controllers\Proprietaire;

use App\Http\Controllers\Controller;
use App\Models\Partenaire;
use Inertia\Inertia;
use Inertia\Response;

class PartenaireController extends Controller
{
    /**
     * Lecture seule sur le catalogue global de partenaires (decision actee : pas de
     * scoping par entreprise, Phase 09) — aucune affordance de creation/edition ici.
     */
    public function index(): Response
    {
        return Inertia::render('proprietaire/partenaires', [
            'partenaires' => Partenaire::orderBy('nom')->get(),
        ]);
    }
}
