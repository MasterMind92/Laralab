<?php

use App\Models\Appartement;
use App\Models\Entreprise;
use App\Models\Equipement;
use App\Models\Intervention;
use App\Models\User;

/**
 * Intervention::TRANSITIONS (app/Models/Intervention.php) est la source unique du workflow
 * Maintenance (Phase 05, R9) — vérifie qu'une transition interdite est refusée et qu'une
 * transition autorisée écrit bien le nouvel état.
 */
function creerIntervention(int $entrepriseId): Intervention
{
    $appartement = Appartement::factory()->create(['entreprise_id' => $entrepriseId]);
    $equipement = Equipement::create(['nom' => 'Climatiseur', 'type' => 'electromenager', 'statut' => 'affecte', 'appartement_id' => $appartement->id]);

    return Intervention::create([
        'equipement_id' => $equipement->id,
        'appartement_id' => $appartement->id,
        'description_panne' => 'Ne refroidit plus',
        'priorite' => 'normale',
        'date_signalement' => now(),
        'sla_echeance' => now()->addDay(),
        // Le defaut SQL ('signalee') ne remonte pas dans l'instance renvoyee par
        // create() — il faut le poser explicitement pour un test fiable.
        'etape' => 'signalee',
    ]);
}

test('une transition interdite par TRANSITIONS est refusee', function () {
    $entreprise = Entreprise::factory()->create();
    $maintenance = User::factory()->create(['role' => 'maintenance', 'entreprise_id' => $entreprise->id]);
    $intervention = creerIntervention($entreprise->id);

    expect($intervention->etape)->toBe('signalee');
    expect($intervention->peutPasserA('reparee'))->toBeFalse();

    $response = $this->actingAs($maintenance)->patch(
        route('maintenance.etape', $intervention),
        ['etape' => 'reparee'],
    );

    $response->assertSessionHasErrors('etape');
    expect($intervention->fresh()->etape)->toBe('signalee');
});

test('une transition autorisee par TRANSITIONS ecrit le nouvel etat', function () {
    $entreprise = Entreprise::factory()->create();
    $maintenance = User::factory()->create(['role' => 'maintenance', 'entreprise_id' => $entreprise->id]);
    $intervention = creerIntervention($entreprise->id);

    expect($intervention->peutPasserA('en_cours'))->toBeTrue();

    $response = $this->actingAs($maintenance)->patch(
        route('maintenance.etape', $intervention),
        ['etape' => 'en_cours'],
    );

    $response->assertRedirect();
    $response->assertSessionHasNoErrors();
    expect($intervention->fresh()->etape)->toBe('en_cours');
});
