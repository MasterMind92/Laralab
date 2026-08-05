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
        Schema::create('reductions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appartement_id')->constrained('appartements')->cascadeOnDelete();
            // Palier progressif : pas de borne max, le palier applicable est celui au plus
            // grand nuits_min <= nombre de nuits reservees (cf. Appartement::reductionApplicable()).
            $table->unsignedInteger('nuits_min');
            $table->enum('type', ['pourcentage', 'montant_fixe']);
            $table->decimal('valeur', 10, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reductions');
    }
};
