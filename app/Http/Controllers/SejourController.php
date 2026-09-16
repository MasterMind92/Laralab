<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ExportsCsv;
use App\Models\Equipement;
use App\Models\Reservation;
use App\Models\Sejour;
use App\Models\Tache;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SejourController extends Controller
{
    use ExportsCsv;

    /**
     * Liste des séjours pour le datatable Réceptionniste.
     */
    public function index(): Response
    {
        return Inertia::render('receptionniste/sejours', [
            'sejours' => Sejour::with([
                'reservation:id,appartement_id,client_id',
                'reservation.appartement:id,numero',
                'reservation.appartement.equipements:id,nom,appartement_id',
                'reservation.client:id,nom,prenom',
                'dommages',
            ])
                ->orderByDesc('date_entree')
                ->get(),
        ]);
    }

    /**
     * Effectue le check-in d'une réservation validée (création du séjour).
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            // Pas d'exists: ici : Reservation::findOrFail() juste en dessous fait deja
            // la verification via une requete cloisonnee.
            'reservation_id' => ['required', 'integer'],
            'etat_lieux_entree' => ['nullable', 'string'],
        ]);

        $reservation = Reservation::findOrFail($data['reservation_id']);

        if ($reservation->statut !== 'validee') {
            return back()->withErrors([
                'reservation_id' => "Seule une réservation validée peut faire l'objet d'un check-in.",
            ]);
        }

        if ($reservation->sejour()->exists()) {
            return back()->withErrors([
                'reservation_id' => 'Cette réservation a déjà un séjour associé.',
            ]);
        }

        Sejour::create([
            'reservation_id' => $reservation->id,
            'date_entree' => now()->toDateString(),
            'etat_lieux_entree' => $data['etat_lieux_entree'] ?? null,
            'statut' => 'en_cours',
        ]);

        return back();
    }

    /**
     * Clôture un séjour en cours (check-out) : état des lieux de sortie, dommages
     * constatés (une ligne par dommage), et fait passer la réservation associée à
     * 'terminee'.
     */
    public function checkout(Request $request, Sejour $sejour): RedirectResponse
    {
        $data = $request->validate([
            'etat_lieux_sortie' => ['nullable', 'string'],
            'dommages' => ['nullable', 'array'],
            'dommages.*.equipement_id' => ['nullable', 'integer'],
            'dommages.*.description' => ['required_with:dommages', 'string', 'max:255'],
            'dommages.*.montant' => ['nullable', 'numeric', 'min:0'],
        ]);

        if ($sejour->statut !== 'en_cours') {
            return back()->withErrors([
                'sejour' => "Seul un séjour en cours peut faire l'objet d'un check-out.",
            ]);
        }

        // Equipement n'a pas de scope automatique : whereHas('appartement') est le
        // garde-fou manuel prescrit par le modele, exists: ne suffit pas (voir DommageController).
        foreach ($data['dommages'] ?? [] as $dommage) {
            if ($dommage['equipement_id'] ?? null) {
                Equipement::whereHas('appartement')->findOrFail($dommage['equipement_id']);
            }
        }

        DB::transaction(function () use ($sejour, $data) {
            $sejour->update([
                'date_sortie' => now()->toDateString(),
                'etat_lieux_sortie' => $data['etat_lieux_sortie'] ?? null,
                'statut' => 'cloture',
            ]);

            foreach ($data['dommages'] ?? [] as $dommage) {
                $sejour->dommages()->create($dommage);
            }

            $sejour->reservation->update(['statut' => 'terminee']);

            // Phase 11 : l'inspection apres le depart, meme pattern que la tache
            // d'arrivee generee dans ReservationController::updateStatut().
            Tache::create([
                'appartement_id' => $sejour->reservation->appartement_id,
                'reservation_id' => $sejour->reservation_id,
                'type' => 'controle_general',
                'origine' => 'auto_depart',
                'date_prevue' => now(),
                'statut' => 'a_faire',
            ]);
        });

        return back();
    }

    /**
     * Supprime (soft delete) un séjour — corrige une saisie erronée.
     */
    public function destroy(Sejour $sejour): RedirectResponse
    {
        $sejour->delete();

        return back();
    }

    /**
     * Exporte les séjours créés dans la plage de dates donnée.
     */
    public function export(Request $request): StreamedResponse
    {
        $data = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $sejours = Sejour::with(['reservation.appartement:id,numero', 'reservation.client:id,nom,prenom'])
            ->when($data['from'] ?? null, fn ($q, $from) => $q->whereDate('created_at', '>=', $from))
            ->when($data['to'] ?? null, fn ($q, $to) => $q->whereDate('created_at', '<=', $to))
            ->orderBy('date_entree')
            ->get();

        return $this->streamCsv(
            'sejours.csv',
            ['ID', 'Appartement', 'Client', 'Entrée', 'Sortie', 'Statut'],
            $sejours->map(fn (Sejour $s) => [
                $s->id,
                $s->reservation?->appartement?->numero,
                trim(($s->reservation?->client?->nom ?? '').' '.($s->reservation?->client?->prenom ?? '')),
                $s->date_entree->toDateString(),
                $s->date_sortie?->toDateString(),
                $s->statut,
            ]),
        );
    }
}
