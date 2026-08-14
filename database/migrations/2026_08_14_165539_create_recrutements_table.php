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
        Schema::create('recrutements', function (Blueprint $table) {
            $table->id();
            $table->string('poste');
            $table->string('departement')->nullable();
            $table->foreignId('responsable_id')->nullable()->constrained('employes')->nullOnDelete();
            $table->text('profil_recherche')->nullable();
            $table->text('description')->nullable();
            $table->json('competences')->nullable();
            $table->unsignedInteger('nombre_postes')->default(1);
            $table->enum('type_contrat_propose', ['cdi', 'cdd', 'stage'])->nullable();
            $table->date('date_souhaitee')->nullable();
            $table->decimal('budget_min', 10, 2)->nullable();
            $table->decimal('budget_max', 10, 2)->nullable();
            $table->enum('priorite', ['basse', 'normale', 'haute'])->default('normale');
            $table->enum('motif', ['remplacement', 'creation_poste', 'renforcement_equipe'])->nullable();
            $table->date('date_limite_candidature')->nullable();
            $table->string('lieu')->nullable();
            $table->enum('statut', ['brouillon', 'en_attente_validation', 'validee', 'rejetee', 'clos'])->default('brouillon');
            $table->text('motif_rejet')->nullable();
            $table->foreignId('valide_par_id')->nullable()->constrained('employes')->nullOnDelete();
            $table->date('date_validation')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recrutements');
    }
};
