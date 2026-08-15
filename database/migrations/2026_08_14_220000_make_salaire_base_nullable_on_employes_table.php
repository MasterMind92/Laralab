<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * salaire_base n'est plus la référence salariale depuis la Phase 04 (voir
     * Employe::contratActif()) : le vrai salaire vit sur ContratTravail. La colonne
     * reste utile (renseignée automatiquement à l'embauche depuis l'offre acceptée),
     * mais ne doit plus être obligatoire à la création manuelle d'un employé.
     * DB::statement plutôt que ->change() pour ne pas ajouter doctrine/dbal.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE employes MODIFY salaire_base DECIMAL(10,2) NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE employes MODIFY salaire_base DECIMAL(10,2) NOT NULL');
    }
};
