<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ExportsCsv;
use App\Models\Appartement;
use App\Models\DemandeService;
use App\Models\Partenaire;
use App\Models\Sejour;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DemandeServiceController extends Controller
{
    use ExportsCsv;

    /**
     * Liste des demandes de service pour le datatable Réceptionniste.
     */
    public function index(): Response
    {
        return Inertia::render('receptionniste/demandes-service', [
            'demandes' => DemandeService::with([
                'appartement:id,numero',
                'sejour:id,reservation_id',
                'sejour.reservation.client:id,nom,prenom',
                'partenaire:id,nom',
            ])
                ->orderByDesc('created_at')
                ->get(),
            'appartements' => Appartement::orderBy('numero')->get(['id', 'numero']),
            'partenaires' => Partenaire::orderBy('nom')->get(['id', 'nom', 'type_service']),
            'sejoursEnCours' => Sejour::where('statut', 'en_cours')
                ->with(['reservation:id,appartement_id,client_id', 'reservation.client:id,nom,prenom'])
                ->get(['id', 'reservation_id']),
        ]);
    }

    /**
     * Enregistre une demande de service (commande passée à un partenaire externe) pour
     * un appartement — liée à un séjour en cours si applicable, sinon simple demande
     * hors séjour (ex. réapprovisionnement entre deux réservations).
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'appartement_id' => ['required', 'integer', 'exists:appartements,id'],
            'sejour_id' => ['nullable', 'integer', 'exists:sejours,id'],
            'partenaire_id' => ['nullable', 'integer', 'exists:partenaires,id'],
            'designation' => ['required', 'string', 'max:255'],
            'quantite' => ['required', 'integer', 'min:1'],
            'prix_unitaire' => ['required', 'numeric', 'min:0'],
        ]);

        if (! empty($data['sejour_id'])) {
            $sejour = Sejour::findOrFail($data['sejour_id']);

            if ($sejour->statut !== 'en_cours') {
                return back()->withErrors([
                    'sejour_id' => "Seul un séjour en cours peut avoir de nouvelles demandes.",
                ]);
            }
        }

        DemandeService::create([
            'appartement_id' => $data['appartement_id'],
            'sejour_id' => $data['sejour_id'] ?? null,
            'partenaire_id' => $data['partenaire_id'] ?? null,
            'designation' => $data['designation'],
            'quantite' => $data['quantite'],
            'prix_unitaire' => $data['prix_unitaire'],
            'statut' => 'demandee',
        ]);

        return back();
    }

    /**
     * Marque une demande comme livrée.
     */
    public function update(DemandeService $demandeService): RedirectResponse
    {
        $demandeService->update(['statut' => 'livree']);

        return back();
    }

    /**
     * Supprime (soft delete) une demande — corrige une saisie erronée.
     */
    public function destroy(DemandeService $demandeService): RedirectResponse
    {
        $demandeService->delete();

        return back();
    }

    /**
     * Exporte les demandes créées dans la plage de dates donnée.
     */
    public function export(Request $request): StreamedResponse
    {
        $data = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $demandes = DemandeService::with(['appartement:id,numero', 'partenaire:id,nom'])
            ->when($data['from'] ?? null, fn ($q, $from) => $q->whereDate('created_at', '>=', $from))
            ->when($data['to'] ?? null, fn ($q, $to) => $q->whereDate('created_at', '<=', $to))
            ->orderByDesc('created_at')
            ->get();

        return $this->streamCsv(
            'demandes-service.csv',
            ['ID', 'Appartement', 'Partenaire', 'Désignation', 'Quantité', 'Prix unitaire', 'Statut', 'Créée le'],
            $demandes->map(fn (DemandeService $d) => [
                $d->id,
                $d->appartement?->numero,
                $d->partenaire?->nom,
                $d->designation,
                $d->quantite,
                $d->prix_unitaire,
                $d->statut,
                $d->created_at->toDateString(),
            ]),
        );
    }
}
