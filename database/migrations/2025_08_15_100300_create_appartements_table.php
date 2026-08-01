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
        Schema::create('appartements', function (Blueprint $table) {
            $table->id();
            $table->string('numero');
            $table->unsignedInteger('capacite');
            $table->decimal('prix_nuit', 10, 2);
            // L'occupation (disponible/occupé) se déduit de reservations/sejours,
            // ce champ ne couvre que l'état d'entretien du logement.
            $table->enum('statut_entretien', ['propre', 'a_nettoyer', 'en_maintenance'])->default('propre');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appartements');
    }
};
