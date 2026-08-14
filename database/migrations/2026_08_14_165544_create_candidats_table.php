<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('candidats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recrutement_id')->constrained('recrutements')->restrictOnDelete();
            $table->string('nom');
            $table->string('prenom');
            $table->string('email')->nullable();
            $table->string('telephone')->nullable();
            $table->enum('source', ['linkedin', 'site_web', 'indeed', 'autre'])->nullable();
            $table->string('cv_path')->nullable();
            $table->string('lettre_motivation_path')->nullable();
            $table->enum('etape', ['recu', 'a_analyser', 'preselectionne', 'entretien', 'evaluation', 'retenu', 'offre', 'embauche'])->default('recu');
            $table->enum('statut', ['en_cours', 'rejete', 'offre_refusee'])->default('en_cours');
            $table->decimal('salaire_propose', 10, 2)->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('candidats');
    }
};
