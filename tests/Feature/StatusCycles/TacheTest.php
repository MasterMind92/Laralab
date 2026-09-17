<?php

use App\Models\Appartement;
use App\Models\Entreprise;
use App\Models\Tache;
use App\Models\User;

/**
 * Tache::TRANSITIONS (app/Models/Tache.php, Phase 11) : le cycle a_faire -> en_cours ->
 * terminee -> controlee ne permet aucun saut d'étape.
 */
function creerTache(int $entrepriseId): Tache
{
    $appartement = Appartement::factory()->create(['entreprise_id' => $entrepriseId]);

    return Tache::create([
        'appartement_id' => $appartement->id,
        'type' => 'nettoyage',
        'origine' => 'manuelle',
        'priorite' => 'normale',
        'date_prevue' => now(),
        'statut' => 'a_faire',
    ]);
}

test('une transition interdite par TRANSITIONS est refusee', function () {
    $entreprise = Entreprise::factory()->create();
    $rh = User::factory()->create(['role' => 'rh', 'entreprise_id' => $entreprise->id]);
    $tache = creerTache($entreprise->id);

    expect($tache->statut)->toBe('a_faire');
    expect($tache->peutPasserA('controlee'))->toBeFalse();

    $response = $this->actingAs($rh)->patch(
        route('planification.statut', $tache),
        ['statut' => 'controlee'],
    );

    $response->assertSessionHasErrors('statut');
    expect($tache->fresh()->statut)->toBe('a_faire');
});

test('une transition autorisee par TRANSITIONS ecrit le nouvel etat', function () {
    $entreprise = Entreprise::factory()->create();
    $rh = User::factory()->create(['role' => 'rh', 'entreprise_id' => $entreprise->id]);
    $tache = creerTache($entreprise->id);

    expect($tache->peutPasserA('en_cours'))->toBeTrue();

    $response = $this->actingAs($rh)->patch(
        route('planification.statut', $tache),
        ['statut' => 'en_cours'],
    );

    $response->assertRedirect();
    $response->assertSessionHasNoErrors();
    expect($tache->fresh()->statut)->toBe('en_cours');
});
