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
        Schema::create('contrats_travail', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employe_id')->constrained('employes')->restrictOnDelete();
            $table->enum('type_contrat', ['cdi', 'cdd', 'stage']);
            $table->date('date_debut');
            $table->date('date_fin')->nullable();
            $table->string('fichier_contrat')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contrats_travail');
    }
};
