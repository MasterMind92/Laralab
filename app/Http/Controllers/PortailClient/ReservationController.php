<?php

namespace App\Http\Controllers\PortailClient;

use App\Http\Controllers\Controller;
use App\Models\Appartement;
use App\Models\Client;
use App\Models\ParametreFacturation;
use App\Models\Reservation;
use App\Notifications\ReservationConfirmee;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReservationController extends Controller
{
    /**
     * Liste les réservations du client connecté, les plus récentes d'abord.
     */
    public function index(Request $request): Response
    {
        $client = $request->user()->client;

        $reservations = $client
            ? $client->reservations()->with('appartement.reductions')->orderByDesc('date_debut')->get()
            : collect();

        return Inertia::render('portail-client/MyReservationsPage', [
            // Chaque appartement peut appartenir à une entreprise différente
            // (client global) — les paramètres de facturation se résolvent par
            // appartement, pas une seule fois pour toute la liste (Phase 09).
            'reservations' => $reservations->map(function (Reservation $reservation) {
                $appartement = $reservation->appartement;
                $parametres = ParametreFacturation::actuel($appartement->entreprise_id);
                $nights = (int) $reservation->date_debut->diffInDays($reservation->date_fin);
                ['sous_total' => $sousTotal] = $appartement->prixPour($nights);
                $fee = $parametres->frais_service_actif ? round($sousTotal * (float) $parametres->taux_frais_service) : 0;

                return [
                    'id' => $reservation->id,
                    'appartement' => [
                        'id' => $appartement->id,
                        'titre' => $appartement->titre ?? $appartement->numero,
                        'photo' => $appartement->photosAffichables()[0] ?? null,
                    ],
                    'date_debut' => $reservation->date_debut->toDateString(),
                    'date_fin' => $reservation->date_fin->toDateString(),
                    'nights' => $nights,
                    'nombre_personnes' => $reservation->nombre_personnes,
                    'statut' => $reservation->statut,
                    'total' => $sousTotal + $fee,
                ];
            }),
        ]);
    }

    /**
     * Crée la réservation du client connecté (auth + role:client, cf. routes).
     * Revalide tout côté serveur — jamais fait confiance à ce que la page checkout affichait.
     */
    public function store(Request $request): RedirectResponse
    {
        // Résolu avant la validation complète car les règles conditionnelles
        // (mode_reglement/mode_paiement) dépendent des paramètres de facturation
        // de l'entreprise propriétaire de l'appartement (Phase 09, multi-tenant) —
        // find() plutôt que findOrFail() : un id invalide sera de toute façon
        // rejeté proprement par la règle exists:appartements,id ci-dessous.
        $appartement = Appartement::find($request->input('appartement_id'));
        $parametres = ParametreFacturation::actuel($appartement?->entreprise_id);

        $data = $request->validate([
            'appartement_id' => ['required', 'integer', 'exists:appartements,id'],
            'date_debut' => ['required', 'date'],
            'date_fin' => ['required', 'date', 'after:date_debut'],
            'nombre_personnes' => ['nullable', 'integer', 'min:1'],
            'notes' => ['nullable', 'string'],
            'prenom' => ['required', 'string', 'max:255'],
            'nom' => ['required', 'string', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:20'],
            'email' => ['required', 'email', 'max:255'],
            'mode_reglement' => [$parametres->acompte_actif ? 'required' : 'nullable', 'in:acompte,total'],
            'mode_paiement' => [$parametres->acompte_actif ? 'required' : 'nullable', 'in:cb,paypal,mobile_money'],
        ]);

        if ($appartement->statut_entretien !== 'propre') {
            return back()->withErrors([
                'appartement_id' => "Cet appartement n'est pas disponible actuellement.",
            ])->withInput();
        }

        if (Reservation::overlapping($appartement->id, $data['date_debut'], $data['date_fin'])->exists()) {
            return back()->withErrors([
                'date_debut' => 'Cet appartement est déjà réservé sur cette période.',
            ])->withInput();
        }

        $client = $this->syncClient($request, $data);

        $reservation = Reservation::create([
            'appartement_id' => $appartement->id,
            'client_id' => $client->id,
            'date_debut' => $data['date_debut'],
            'date_fin' => $data['date_fin'],
            'statut' => 'en_attente',
            'nombre_personnes' => $data['nombre_personnes'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        if ($parametres->acompte_actif) {
            $nights = (int) $reservation->date_debut->diffInDays($reservation->date_fin);
            ['sous_total' => $sousTotal] = $appartement->prixPour($nights);
            $fee = $parametres->frais_service_actif ? round($sousTotal * (float) $parametres->taux_frais_service) : 0;
            $total = $sousTotal + $fee;
            $acompte = min((float) $appartement->prix_nuit, $total);

            $reservation->paiementInitial()->create([
                'montant' => $data['mode_reglement'] === 'total' ? $total : $acompte,
                'mode_paiement' => $data['mode_paiement'],
                'reference_transaction' => 'RESA-'.$reservation->id,
                'date_paiement' => now(),
            ]);
        }

        $reservation->load('appartement');
        $request->user()->notify(new ReservationConfirmee($reservation));

        return redirect()->route('checkout.client', [
            'apt_id' => $appartement->id,
            'checkin' => $data['date_debut'],
            'checkout' => $data['date_fin'],
        ])->with('reservation_confirmee', true);
    }

    /**
     * Crée la fiche client si elle manque encore, ou la met à jour si les
     * coordonnées saisies au checkout diffèrent de celles déjà enregistrées.
     *
     * @param  array<string, mixed>  $data
     */
    private function syncClient(Request $request, array $data): Client
    {
        $client = $request->user()->client;

        $coordonnees = [
            'nom' => $data['nom'],
            'prenom' => $data['prenom'],
            'telephone' => $data['telephone'] ?? null,
            'email' => $data['email'],
        ];

        if (! $client) {
            return Client::create(['user_id' => $request->user()->id, ...$coordonnees]);
        }

        $modifie = collect($coordonnees)->some(fn ($valeur, $champ) => $client->{$champ} !== $valeur);

        if ($modifie) {
            $client->update($coordonnees);
        }

        return $client;
    }
}
