<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ExportsCsv;
use App\Models\Appartement;
use App\Models\Equipement;
use App\Models\Intervention;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class InterventionController extends Controller
{
    use ExportsCsv;

    /**
     * Liste les équipements affectés à un appartement (le catalogue, appartement_id
     * null, ne concerne pas le réceptionniste) avec leur historique d'interventions.
     * Filtrable par appartement, statut de l'équipement, et plage de dates de
     * signalement (sur les interventions rattachées).
     */
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'appartement_id' => ['nullable', 'integer', 'exists:appartements,id'],
            'statut' => ['nullable', 'in:stock,affecte,en_panne'],
            'date_debut' => ['nullable', 'date'],
            'date_fin' => ['nullable', 'date'],
        ]);

        $equipements = Equipement::whereNotNull('appartement_id')
            ->with(['appartement:id,numero', 'interventions' => fn ($query) => $query->orderByDesc('date_signalement')])
            ->when($filters['appartement_id'] ?? null, fn ($q, $id) => $q->where('appartement_id', $id))
            ->when($filters['statut'] ?? null, fn ($q, $statut) => $q->where('statut', $statut))
            ->when(
                ($filters['date_debut'] ?? null) || ($filters['date_fin'] ?? null),
                fn ($q) => $q->whereHas('interventions', function ($iq) use ($filters) {
                    $iq->when($filters['date_debut'] ?? null, fn ($iq2, $d) => $iq2->whereDate('date_signalement', '>=', $d));
                    $iq->when($filters['date_fin'] ?? null, fn ($iq2, $d) => $iq2->whereDate('date_signalement', '<=', $d));
                }),
            )
            ->orderBy('appartement_id')
            ->orderBy('nom')
            ->get(['id', 'nom', 'type', 'statut', 'appartement_id']);

        return Inertia::render('receptionniste/equipements', [
            'equipements' => $equipements,
            'appartements' => Appartement::orderBy('numero')->get(['id', 'numero']),
            'filters' => $filters,
        ]);
    }

    /**
     * Signale une panne sur un équipement : crée l'Intervention et fait passer
     * l'équipement en 'en_panne' (décision actée — la résolution reste hors périmètre
     * du réceptionniste, qui se contente de signaler).
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'equipement_id' => ['required', 'integer', 'exists:equipements,id'],
            'description_panne' => ['required', 'string'],
        ]);

        $equipement = Equipement::findOrFail($data['equipement_id']);

        DB::transaction(function () use ($equipement, $data, $request) {
            Intervention::create([
                'equipement_id' => $equipement->id,
                'appartement_id' => $equipement->appartement_id,
                'employe_id' => $request->user()->employe?->id,
                'description_panne' => $data['description_panne'],
                'date_signalement' => now(),
                'statut' => 'signalee',
            ]);

            $equipement->update(['statut' => 'en_panne']);
        });

        return back();
    }

    /**
     * Supprime (soft delete) une intervention — corrige une saisie erronée.
     */
    public function destroy(Intervention $intervention): RedirectResponse
    {
        $intervention->delete();

        return back();
    }

    /**
     * Exporte les interventions signalées dans la plage de dates donnée.
     */
    public function export(Request $request): StreamedResponse
    {
        $data = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $interventions = Intervention::with(['equipement:id,nom', 'appartement:id,numero'])
            ->when($data['from'] ?? null, fn ($q, $from) => $q->whereDate('date_signalement', '>=', $from))
            ->when($data['to'] ?? null, fn ($q, $to) => $q->whereDate('date_signalement', '<=', $to))
            ->orderByDesc('date_signalement')
            ->get();

        return $this->streamCsv(
            'interventions.csv',
            ['ID', 'Appartement', 'Équipement', 'Description', 'Statut', 'Signalée le'],
            $interventions->map(fn (Intervention $i) => [
                $i->id,
                $i->appartement?->numero,
                $i->equipement?->nom,
                $i->description_panne,
                $i->statut,
                $i->date_signalement->toDateString(),
            ]),
        );
    }
}
