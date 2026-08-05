<?php

namespace App\Http\Controllers\PortailClient;

use App\Http\Controllers\Controller;
use App\Models\Appartement;
use App\Models\Client;
use App\Models\Reservation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    /**
     * Crée la réservation du client connecté (auth + role:client, cf. routes).
     * Revalide tout côté serveur — jamais fait confiance à ce que la page checkout affichait.
     */
    public function store(Request $request): RedirectResponse
    {
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
        ]);

        $appartement = Appartement::findOrFail($data['appartement_id']);

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

        Reservation::create([
            'appartement_id' => $appartement->id,
            'client_id' => $client->id,
            'date_debut' => $data['date_debut'],
            'date_fin' => $data['date_fin'],
            'statut' => 'en_attente',
            'nombre_personnes' => $data['nombre_personnes'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

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
