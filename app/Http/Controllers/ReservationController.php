<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ExportsCsv;
use App\Http\Requests\StoreReservationRequest;
use App\Models\Client;
use App\Models\Reservation;
use App\Models\Tache;
use App\Notifications\ReservationAnnulee;
use App\Notifications\ReservationValidee;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReservationController extends Controller
{
    use ExportsCsv;

    /**
     * Liste des réservations pour le datatable Réceptionniste.
     */
    public function index(): Response
    {
        return Inertia::render('receptionniste/reservations', [
            'reservations' => Reservation::with([
                'appartement:id,numero',
                'appartement.equipements:id,nom,appartement_id',
                'client:id,nom,prenom',
                'sejour:id,reservation_id,statut',
                'paiementInitial:id,reservation_id,montant,mode_paiement,date_paiement',
            ])
                ->orderByDesc('date_debut')
                ->get(['id', 'appartement_id', 'client_id', 'date_debut', 'date_fin', 'statut', 'created_at']),
        ]);
    }

    /**
     * Store a newly created reservation, en refusant tout chevauchement de dates
     * sur le même appartement (statuts en_attente/validee uniquement).
     */
    public function store(StoreReservationRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $chevauchement = Reservation::overlapping($data['appartement_id'], $data['date_debut'], $data['date_fin'])
            ->exists();

        if ($chevauchement) {
            return back()->withErrors([
                'date_debut' => 'Cet appartement est déjà réservé sur cette période.',
            ])->withInput();
        }

        DB::transaction(function () use ($data) {
            $clientId = $data['client_id'] ?? Client::create($data['client'])->id;

            Reservation::create([
                'appartement_id' => $data['appartement_id'],
                'client_id' => $clientId,
                'date_debut' => $data['date_debut'],
                'date_fin' => $data['date_fin'],
                'statut' => $data['statut'],
            ]);
        });

        return back();
    }

    /**
     * Confirme ou annule une réservation en attente (le seul état de départ autorisé —
     * une réservation déjà validée/annulée/terminée ne peut plus changer d'état ici).
     */
    public function updateStatut(Request $request, Reservation $reservation): RedirectResponse
    {
        $data = $request->validate([
            'statut' => ['required', 'in:validee,annulee'],
        ]);

        if ($reservation->statut !== 'en_attente') {
            return back()->withErrors([
                'statut' => 'Seule une réservation en attente peut être confirmée ou annulée.',
            ]);
        }

        $reservation->update(['statut' => $data['statut']]);
        $reservation->load(['appartement', 'client']);

        // Phase 11 : la tache de preparation avant l'arrivee, generee ici comme les
        // notifications ci-dessous — meme pattern d'appel direct, aucun Observer dans
        // ce codebase.
        if ($data['statut'] === 'validee') {
            Tache::create([
                'appartement_id' => $reservation->appartement_id,
                'reservation_id' => $reservation->id,
                'type' => 'nettoyage',
                'origine' => 'auto_arrivee',
                'date_prevue' => $reservation->date_debut,
                'statut' => 'a_faire',
            ]);
        }

        if ($reservation->client->email) {
            $notification = $data['statut'] === 'validee'
                ? new ReservationValidee($reservation)
                : new ReservationAnnulee($reservation);

            Notification::route('mail', $reservation->client->email)->notify($notification);
        }

        return back();
    }

    /**
     * Supprime (soft delete) une réservation — corrige une saisie erronée, distinct
     * de l'annulation métier (statut 'annulee') qui reste tracée dans l'historique.
     */
    public function destroy(Reservation $reservation): RedirectResponse
    {
        $reservation->delete();

        return back();
    }

    /**
     * Exporte les réservations créées dans la plage de dates donnée.
     */
    public function export(Request $request): StreamedResponse
    {
        $data = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $reservations = Reservation::with(['appartement:id,numero', 'client:id,nom,prenom'])
            ->when($data['from'] ?? null, fn ($q, $from) => $q->whereDate('created_at', '>=', $from))
            ->when($data['to'] ?? null, fn ($q, $to) => $q->whereDate('created_at', '<=', $to))
            ->orderBy('date_debut')
            ->get();

        return $this->streamCsv(
            'reservations.csv',
            ['ID', 'Appartement', 'Client', 'Arrivée', 'Départ', 'Statut', 'Créée le'],
            $reservations->map(fn (Reservation $r) => [
                $r->id,
                $r->appartement?->numero,
                trim(($r->client?->nom ?? '').' '.($r->client?->prenom ?? '')),
                $r->date_debut->toDateString(),
                $r->date_fin->toDateString(),
                $r->statut,
                $r->created_at->toDateString(),
            ]),
        );
    }
}
