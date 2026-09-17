<?php

use App\Models\Entreprise;
use App\Models\FactureFournisseur;
use App\Models\Fournisseur;
use App\Models\User;

/**
 * FactureFournisseur::TRANSITIONS (app/Models/FactureFournisseur.php). Le paiement a sa
 * propre route dédiée (comptabilite.achats.paiement, hors périmètre ici) : la route de
 * statut générique n'accepte même pas "payee" dans sa liste — le test porte donc sur un
 * ciblage refusé PARMI ceux que la route accepte (validee/a_valider/annulee) : rester sur
 * place ("a_valider" -> "a_valider") n'est pas une transition prévue par TRANSITIONS.
 */
function creerFactureFournisseur(int $entrepriseId): FactureFournisseur
{
    $fournisseur = Fournisseur::create(['entreprise_id' => $entrepriseId, 'nom' => 'Fournisseur test', 'actif' => true]);

    return FactureFournisseur::create([
        'entreprise_id' => $entrepriseId,
        'fournisseur_id' => $fournisseur->id,
        'date_facture' => now(),
    ]);
}

test('une transition interdite par TRANSITIONS est refusee', function () {
    $entreprise = Entreprise::factory()->create();
    $compta = User::factory()->create(['role' => 'compta', 'entreprise_id' => $entreprise->id]);
    $facture = creerFactureFournisseur($entreprise->id);

    expect($facture->statut)->toBe('a_valider');
    expect($facture->peutPasserA('a_valider'))->toBeFalse();

    $response = $this->actingAs($compta)->patch(
        route('comptabilite.achats.statut', $facture),
        ['statut' => 'a_valider'],
    );

    $response->assertSessionHasErrors('statut');
    expect($facture->fresh()->statut)->toBe('a_valider');
});

test('une transition autorisee par TRANSITIONS ecrit le nouvel etat', function () {
    $entreprise = Entreprise::factory()->create();
    $compta = User::factory()->create(['role' => 'compta', 'entreprise_id' => $entreprise->id]);
    $facture = creerFactureFournisseur($entreprise->id);

    expect($facture->peutPasserA('validee'))->toBeTrue();

    $response = $this->actingAs($compta)->patch(
        route('comptabilite.achats.statut', $facture),
        ['statut' => 'validee'],
    );

    $response->assertRedirect();
    $response->assertSessionHasNoErrors();
    $facture->refresh();
    expect($facture->statut)->toBe('validee');
    expect($facture->date_validation)->not->toBeNull();
});
