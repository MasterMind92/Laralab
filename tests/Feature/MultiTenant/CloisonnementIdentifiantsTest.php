<?php

use App\Models\Appartement;
use App\Models\Conge;
use App\Models\Employe;
use App\Models\Entreprise;
use App\Models\Equipement;
use App\Models\User;

/**
 * Preuve par l'HTTP (pas juste par tinker comme lors du correctif du 2026-09-16) que le
 * cloisonnement multi-tenant tient : un identifiant soumis par un utilisateur d'une
 * entreprise, mais appartenant à une AUTRE entreprise, doit toujours être rejeté par une
 * requête cloisonnée (Employe::findOrFail(), Appartement::findOrFail()...), jamais accepté
 * par une règle exists: qui ignore les global scopes.
 */
test('un employe hors tenant est rejete par CongeController::store', function () {
    $entrepriseA = Entreprise::factory()->create();
    $entrepriseB = Entreprise::factory()->create();

    $rh = User::factory()->create(['role' => 'rh', 'entreprise_id' => $entrepriseA->id]);
    $employeB = Employe::factory()->create(['entreprise_id' => $entrepriseB->id]);

    $response = $this->actingAs($rh)->post(route('conges.store'), [
        'employe_id' => $employeB->id,
        'date_debut' => now()->toDateString(),
        'date_fin' => now()->addDay()->toDateString(),
    ]);

    $response->assertNotFound();
    expect(Conge::where('employe_id', $employeB->id)->exists())->toBeFalse();
});

test('un employe de la meme entreprise est accepte par CongeController::store', function () {
    $entreprise = Entreprise::factory()->create();
    $rh = User::factory()->create(['role' => 'rh', 'entreprise_id' => $entreprise->id]);
    $employe = Employe::factory()->create(['entreprise_id' => $entreprise->id]);

    $response = $this->actingAs($rh)->post(route('conges.store'), [
        'employe_id' => $employe->id,
        'date_debut' => now()->toDateString(),
        'date_fin' => now()->addDay()->toDateString(),
    ]);

    $response->assertRedirect();
    $response->assertSessionHasNoErrors();
    expect(Conge::where('employe_id', $employe->id)->exists())->toBeTrue();
});

test('InterventionController::index ne rend plus le parc equipement d\'une autre entreprise', function () {
    $entrepriseA = Entreprise::factory()->create();
    $entrepriseB = Entreprise::factory()->create();

    $receptionniste = User::factory()->create(['role' => 'receptionniste', 'entreprise_id' => $entrepriseA->id]);

    $appartA = Appartement::factory()->create(['entreprise_id' => $entrepriseA->id]);
    $appartB = Appartement::factory()->create(['entreprise_id' => $entrepriseB->id]);

    Equipement::create(['nom' => 'Climatiseur A', 'type' => 'electromenager', 'statut' => 'affecte', 'appartement_id' => $appartA->id]);
    Equipement::create(['nom' => 'Climatiseur B', 'type' => 'electromenager', 'statut' => 'affecte', 'appartement_id' => $appartB->id]);

    $response = $this->actingAs($receptionniste)->get(route('receptionniste.equipements'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('equipements', 1)
        ->where('equipements.0.nom', 'Climatiseur A')
    );
});
