<?php

use App\Models\Appartement;
use App\Models\Client;
use App\Models\Entreprise;
use App\Models\Facture;
use App\Models\Reservation;
use App\Models\Sejour;
use App\Models\User;

/**
 * Parcours de bout en bout côté staff : réservation validée -> check-in -> check-out ->
 * génération du devis -> validation -> encaissement. Le portail public (création de la
 * réservation par le client) a son propre historique de tests depuis la Phase 02, hors
 * périmètre ici — on part d'une réservation déjà 'validee'.
 */
test('une reservation validee suit tout le parcours jusqu\'a l\'encaissement', function () {
    $entreprise = Entreprise::factory()->create();
    $receptionniste = User::factory()->create(['role' => 'receptionniste', 'entreprise_id' => $entreprise->id]);
    $compta = User::factory()->create(['role' => 'compta', 'entreprise_id' => $entreprise->id]);

    $appartement = Appartement::factory()->create(['entreprise_id' => $entreprise->id, 'prix_nuit' => 20000]);
    $client = Client::create(['nom' => 'Kouassi', 'prenom' => 'Awa', 'email' => 'awa@example.test']);

    $reservation = Reservation::create([
        'appartement_id' => $appartement->id,
        'client_id' => $client->id,
        'date_debut' => now()->subDays(2)->toDateString(),
        'date_fin' => now()->toDateString(),
        'statut' => 'validee',
        'nombre_personnes' => 2,
    ]);

    // --- Check-in ---
    $this->actingAs($receptionniste)
        ->post(route('sejours.store'), ['reservation_id' => $reservation->id])
        ->assertRedirect();

    $sejour = Sejour::where('reservation_id', $reservation->id)->firstOrFail();
    expect($sejour->statut)->toBe('en_cours');

    // --- Check-out ---
    $this->actingAs($receptionniste)
        ->patch(route('sejours.checkout', $sejour), [])
        ->assertRedirect();

    $sejour->refresh();
    $reservation->refresh();
    expect($sejour->statut)->toBe('cloture');
    expect($reservation->statut)->toBe('terminee');

    // --- Generation du devis (par le Receptionniste, Phase 03) ---
    $this->actingAs($receptionniste)
        ->post(route('factures.generer', $sejour))
        ->assertRedirect();

    $facture = Facture::where('sejour_id', $sejour->id)->firstOrFail();
    expect($facture->statut)->toBe('brouillon');
    expect((float) $facture->montant_ttc)->toBeGreaterThan(0);

    // --- Validation du devis ---
    $this->actingAs($compta)
        ->patch(route('factures.valider', $facture))
        ->assertRedirect();

    $facture->refresh();
    expect($facture->statut)->toBe('validee');
    expect($facture->numero_facture)->not->toBeNull();

    // --- Encaissement (solde en une fois) ---
    $this->actingAs($compta)
        ->post(route('paiements.store', $facture), [
            'montant' => $facture->soldeRestant(),
            'mode_paiement' => 'especes',
        ])
        ->assertRedirect();

    $facture->refresh();
    expect($facture->statut)->toBe('payee');
    expect($facture->soldeRestant())->toBe(0.0);
});
