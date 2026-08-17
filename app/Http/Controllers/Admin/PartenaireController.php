<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePartenaireRequest;
use App\Models\Partenaire;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PartenaireController extends Controller
{
    /**
     * Catalogue global (non scope par entreprise, decision actee Phase 09).
     */
    public function index(): Response
    {
        return Inertia::render('admin/partenaires/index', [
            'partenaires' => Partenaire::orderBy('nom')->get(),
        ]);
    }

    public function store(StorePartenaireRequest $request): RedirectResponse
    {
        Partenaire::create($request->validated());

        return back();
    }

    public function update(StorePartenaireRequest $request, Partenaire $partenaire): RedirectResponse
    {
        $partenaire->update($request->validated());

        return back();
    }

    public function destroy(Partenaire $partenaire): RedirectResponse
    {
        $partenaire->delete();

        return back();
    }
}
