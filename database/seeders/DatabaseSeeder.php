<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $roles = [
            'administrateur',
            'proprietaire',
            'gerant',
            'commercial',
            'rh',
            'compta',
            'logistique',
            'maintenance',
            'receptionniste',
            'client',
        ];

        foreach ($roles as $role) {
            User::factory()->create([
                'name' => ucfirst($role),
                'email' => "{$role}@laralab.test",
                'password' => Hash::make('12345678'),
                'role' => $role,
            ]);
        }

        $this->call(EquipementCatalogueSeeder::class);
    }
}
