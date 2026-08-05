<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAppartementRequest;
use App\Http\Requests\UpdateAppartementRequest;
use App\Models\Appartement;
use App\Models\Equipement;
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
            'appartements' => Appartement::with(['equipements', 'reductions'])->orderBy('numero')->get(),
            'equipementsCatalogue' => Equipement::whereNull('appartement_id')
                ->orderBy('nom')
                ->get(['id', 'nom', 'icone']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreAppartementRequest $request): RedirectResponse
    {
        $data = $request->safe()->except('photos');

        $appartement = Appartement::create($data);

        if ($request->hasFile('photos')) {
            $appartement->update(['photos' => $this->uploadPhotos($request->file('photos'))]);
        }

        return back();
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateAppartementRequest $request, Appartement $appartement): RedirectResponse
    {
        $data = $request->safe()->except(['photos', 'equipements', 'reductions']);

        if ($request->hasFile('photos')) {
            $data['photos'] = [...($appartement->photos ?? []), ...$this->uploadPhotos($request->file('photos'))];
        }

        $appartement->update($data);

        if ($request->has('equipements')) {
            $this->syncEquipements($appartement, $request->input('equipements', []));
        }

        if ($request->has('reductions')) {
            $this->syncReductions($appartement, $request->input('reductions', []));
        }

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

    /**
     * Stocke les chemins relatifs (pas d'URL absolue figée) : l'URL réelle est
     * recalculée à l'affichage par Appartement::photosAffichables(), pour ne pas
     * dépendre de l'adresse locale utilisée au moment de l'upload (APP_URL).
     *
     * @param  array<\Illuminate\Http\UploadedFile>  $files
     * @return array<string>
     */
    private function uploadPhotos(array $files): array
    {
        return collect($files)
            ->map(fn ($file) => $file->store('appartements', 'public'))
            ->all();
    }

    /**
     * Synchronise les équipements de cet appartement avec la sélection du catalogue
     * (catalogueIds = équipements « modèles », appartement_id null). Cocher clone une
     * ligne dédiée à cet appartement ; décocher supprime cette ligne dédiée (jamais les
     * modèles du catalogue — la remettre au stock créerait un doublon dans le catalogue,
     * qui interroge la même colonne appartement_id).
     *
     * @param  array<int>  $catalogueIds
     */
    private function syncEquipements(Appartement $appartement, array $catalogueIds): void
    {
        $selection = Equipement::whereNull('appartement_id')->whereIn('id', $catalogueIds)->get();
        $nomsSelectionnes = $selection->pluck('nom')->all();

        $actuels = $appartement->equipements()->get();

        foreach ($actuels as $equipement) {
            if (! in_array($equipement->nom, $nomsSelectionnes, true)) {
                $equipement->delete();
            }
        }

        $nomsActuels = $actuels->pluck('nom')->all();

        foreach ($selection as $modele) {
            if (! in_array($modele->nom, $nomsActuels, true)) {
                Equipement::create([
                    'nom' => $modele->nom,
                    'type' => $modele->type,
                    'icone' => $modele->icone,
                    'statut' => 'affecte',
                    'appartement_id' => $appartement->id,
                ]);
            }
        }
    }

    /**
     * Remplace intégralement les paliers de réduction de cet appartement. Contrairement
     * aux équipements (clonés depuis un catalogue partagé), chaque palier n'existe que
     * pour cet appartement : pas de diffing nécessaire, le formulaire resoumet toutes
     * les lignes à chaque sauvegarde.
     *
     * @param  array<array{nuits_min: int, type: string, valeur: float}>  $reductions
     */
    private function syncReductions(Appartement $appartement, array $reductions): void
    {
        $appartement->reductions()->delete();

        $appartement->reductions()->createMany(array_map(fn (array $r) => [
            'nuits_min' => $r['nuits_min'],
            'type' => $r['type'],
            'valeur' => $r['valeur'],
        ], $reductions));
    }
}
