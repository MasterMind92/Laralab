<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * salaire_base n'est plus la référence salariale depuis la Phase 04 (voir
     * Employe::contratActif()) : le vrai salaire vit sur ContratTravail. La colonne
     * reste utile (renseignée automatiquement à l'embauche depuis l'offre acceptée),
     * mais ne doit plus être obligatoire à la création manuelle d'un employé.
     * `->change()` ne nécessite PAS doctrine/dbal dans cette version de Laravel
     * (vérifié sur MySQL et SQLite, 2026-09-17) — portable sur les deux pilotes.
     */
    public function up(): void
    {
        Schema::table('employes', function (Blueprint $table) {
            $table->decimal('salaire_base', 10, 2)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employes', function (Blueprint $table) {
            $table->decimal('salaire_base', 10, 2)->nullable(false)->change();
        });
    }
};
