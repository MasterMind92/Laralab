<?php

namespace Database\Seeders;

use App\Models\Equipement;
use Illuminate\Database\Seeder;

class EquipementCatalogueSeeder extends Seeder
{
    /**
     * Catalogue d'équipements réutilisables (appartement_id null) repris des libellés
     * déjà présents dans resources/js/lib/data.ts, pour que le portail affiche des
     * équipements réels plutôt qu'une liste fictive.
     */
    public function run(): void
    {
        $catalogue = [
            ['nom' => 'Wifi haut débit', 'icone' => 'Wifi'],
            ['nom' => 'Climatisation', 'icone' => 'Snowflake'],
            ['nom' => 'Smart TV 4K', 'icone' => 'Tv'],
            ['nom' => 'Cuisine équipée', 'icone' => 'UtensilsCrossed'],
            ['nom' => 'Parking privé', 'icone' => 'Car'],
            ['nom' => 'Accès sécurisé', 'icone' => 'Lock'],
            ['nom' => 'Machine à laver', 'icone' => 'WashingMachine'],
            ['nom' => 'Conciergerie', 'icone' => 'ConciergeBell'],
            ['nom' => 'Vue sur l\'océan', 'icone' => 'Waves'],
            ['nom' => 'Piscine privée', 'icone' => 'Waves'],
        ];

        foreach ($catalogue as $item) {
            Equipement::firstOrCreate(
                ['nom' => $item['nom'], 'appartement_id' => null],
                ['type' => 'Confort', 'icone' => $item['icone'], 'statut' => 'stock'],
            );
        }
    }
}
