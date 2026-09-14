<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Phase 11 : vocabulaire structure (contrairement a Employe::poste, reste en texte
     * libre) pour rapprocher un employe du type de Tache qu'il sait faire. Les 4
     * libelles de base sont alignes sur Tache::TYPES et inseres ici directement : ce
     * sont des donnees de reference necessaires au fonctionnement de l'ecran, pas des
     * donnees de demo — la liste reste ensuite extensible a la volee depuis la fiche
     * employe (CompetenceController::store()).
     */
    public function up(): void
    {
        Schema::create('competences', function (Blueprint $table) {
            $table->id();
            $table->string('libelle')->unique();
            $table->timestamps();
        });

        DB::table('competences')->insert([
            ['libelle' => 'Ménage', 'created_at' => now(), 'updated_at' => now()],
            ['libelle' => 'Linge', 'created_at' => now(), 'updated_at' => now()],
            ['libelle' => 'Réassort', 'created_at' => now(), 'updated_at' => now()],
            ['libelle' => 'Contrôle général', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('competences');
    }
};
