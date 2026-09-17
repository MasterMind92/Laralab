<?php

namespace Database\Factories;

use App\Models\Appartement;
use App\Models\Entreprise;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Appartement>
 */
class AppartementFactory extends Factory
{
    protected $model = Appartement::class;

    public function definition(): array
    {
        return [
            'entreprise_id' => Entreprise::factory(),
            'numero' => fake()->unique()->bothify('A-###'),
            'titre' => fake()->streetName(),
            'type' => 'studio',
            'capacite' => fake()->numberBetween(1, 4),
            'prix_nuit' => fake()->numberBetween(15000, 60000),
            'statut_entretien' => 'propre',
            'chambres' => 1,
            'salles_de_bain' => 1,
            'surface_m2' => fake()->numberBetween(20, 80),
        ];
    }
}
