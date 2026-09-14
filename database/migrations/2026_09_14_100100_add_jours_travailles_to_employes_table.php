<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Phase 11 : planning hebdomadaire d'un employe, purement informatif dans l'ecran
     * d'assignation manuelle de Planification (jamais un filtre bloquant). Tableau
     * d'entiers 0-6 (0 = lundi ... 6 = dimanche) ; null = aucune restriction declaree,
     * comportement actuel pour tout employe existant, donc pas de backfill necessaire.
     */
    public function up(): void
    {
        Schema::table('employes', function (Blueprint $table) {
            $table->json('jours_travailles')->nullable()->after('actif');
        });
    }

    public function down(): void
    {
        Schema::table('employes', function (Blueprint $table) {
            $table->dropColumn('jours_travailles');
        });
    }
};
