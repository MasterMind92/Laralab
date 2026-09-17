<?php

use App\Models\Commande;
use App\Models\DevisEquipement;
use App\Models\Entreprise;
use App\Models\Fournisseur;
use App\Models\Reception;
use App\Models\User;

/**
 * DevisEquipement::TRANSITIONS (app/Models/DevisEquipement.php, extension Phase 06) —
 * calqué sur FactureFournisseur : rester sur place ("brouillon" -> "brouillon") n'est pas
 * une transition prévue.
 */
function creerDevisEquipement(int $entrepriseId): DevisEquipement
{
    $fournisseur = Fournisseur::create(['entreprise_id' => $entrepriseId, 'nom' => 'Fournisseur test', 'actif' => true]);
    $commande = Commande::create(['entreprise_id' => $entrepriseId, 'fournisseur_id' => $fournisseur->id, 'date_commande' => now()]);
    $reception = Reception::create(['commande_id' => $commande->id, 'date_reception' => now()]);

    return DevisEquipement::create([
        'entreprise_id' => $entrepriseId,
        'reception_id' => $reception->id,
    ]);
}

test('une transition interdite par TRANSITIONS est refusee', function () {
    $entreprise = Entreprise::factory()->create();
    $compta = User::factory()->create(['role' => 'compta', 'entreprise_id' => $entreprise->id]);
    $devis = creerDevisEquipement($entreprise->id);

    expect($devis->statut)->toBe('brouillon');
    expect($devis->peutPasserA('brouillon'))->toBeFalse();

    $response = $this->actingAs($compta)->patch(
        route('comptabilite.devis-equipements.statut', $devis),
        ['statut' => 'brouillon'],
    );

    $response->assertSessionHasErrors('statut');
    expect($devis->fresh()->statut)->toBe('brouillon');
});

test('une transition autorisee par TRANSITIONS ecrit le nouvel etat', function () {
    $entreprise = Entreprise::factory()->create();
    $compta = User::factory()->create(['role' => 'compta', 'entreprise_id' => $entreprise->id]);
    $devis = creerDevisEquipement($entreprise->id);

    expect($devis->peutPasserA('validee'))->toBeTrue();

    $response = $this->actingAs($compta)->patch(
        route('comptabilite.devis-equipements.statut', $devis),
        ['statut' => 'validee'],
    );

    $response->assertRedirect();
    $response->assertSessionHasNoErrors();
    $devis->refresh();
    expect($devis->statut)->toBe('validee');
    expect($devis->date_validation)->not->toBeNull();
});
