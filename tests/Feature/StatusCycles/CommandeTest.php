<?php

use App\Models\Commande;
use App\Models\Entreprise;
use App\Models\Fournisseur;
use App\Models\User;

/**
 * Commande::TRANSITIONS (app/Models/Commande.php) — transitions MANUELLES uniquement,
 * partiellement_recue/recue ne s'atteignent que via recalculerStatut() (hors périmètre ici).
 */
function creerCommande(int $entrepriseId): Commande
{
    $fournisseur = Fournisseur::create(['entreprise_id' => $entrepriseId, 'nom' => 'Fournisseur test', 'actif' => true]);

    return Commande::create([
        'entreprise_id' => $entrepriseId,
        'fournisseur_id' => $fournisseur->id,
        'date_commande' => now(),
    ]);
}

test('une transition interdite par TRANSITIONS est refusee', function () {
    $entreprise = Entreprise::factory()->create();
    $logistique = User::factory()->create(['role' => 'logistique', 'entreprise_id' => $entreprise->id]);
    $commande = creerCommande($entreprise->id);

    expect($commande->statut)->toBe('brouillon');
    expect($commande->peutPasserA('confirmee'))->toBeFalse();

    $response = $this->actingAs($logistique)->patch(
        route('logistique.commandes.statut', $commande),
        ['statut' => 'confirmee'],
    );

    $response->assertSessionHasErrors('statut');
    expect($commande->fresh()->statut)->toBe('brouillon');
});

test('une transition autorisee par TRANSITIONS ecrit le nouvel etat', function () {
    $entreprise = Entreprise::factory()->create();
    $logistique = User::factory()->create(['role' => 'logistique', 'entreprise_id' => $entreprise->id]);
    $commande = creerCommande($entreprise->id);

    expect($commande->peutPasserA('envoyee'))->toBeTrue();

    $response = $this->actingAs($logistique)->patch(
        route('logistique.commandes.statut', $commande),
        ['statut' => 'envoyee'],
    );

    $response->assertRedirect();
    $response->assertSessionHasNoErrors();
    expect($commande->fresh()->statut)->toBe('envoyee');
});
