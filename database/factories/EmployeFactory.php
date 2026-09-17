<?php

namespace Database\Factories;

use App\Models\Employe;
use App\Models\Entreprise;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Employe>
 */
class EmployeFactory extends Factory
{
    protected $model = Employe::class;

    public function definition(): array
    {
        return [
            'entreprise_id' => Entreprise::factory(),
            'nom' => fake()->lastName(),
            'prenom' => fake()->firstName(),
            'poste' => 'Technicien maintenance',
            'date_embauche' => fake()->dateTimeBetween('-2 years', 'now'),
            'actif' => true,
        ];
    }
}
