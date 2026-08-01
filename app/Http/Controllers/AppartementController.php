<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAppartementRequest;
use App\Http\Requests\UpdateAppartementRequest;
use App\Models\Appartement;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AppartementController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        return Inertia::render('appartements/index', [
            'appartements' => Appartement::orderBy('numero')->get(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreAppartementRequest $request): RedirectResponse
    {
        Appartement::create($request->validated());

        return back();
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateAppartementRequest $request, Appartement $appartement): RedirectResponse
    {
        $appartement->update($request->validated());

        return back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Appartement $appartement): RedirectResponse
    {
        if ($appartement->reservations()->exists()) {
            return back()->withErrors([
                'appartement' => 'Impossible de supprimer un appartement ayant des réservations associées.',
            ]);
        }

        $appartement->delete();

        return back();
    }
}
