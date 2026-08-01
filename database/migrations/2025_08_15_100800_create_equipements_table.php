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
        Schema::create('equipements', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('type');
            $table->date('date_achat')->nullable();
            $table->enum('statut', ['stock', 'affecte', 'en_panne'])->default('stock');
            // Remplace l'ancien champ texte libre "affecte_a" par de vraies relations.
            $table->foreignId('employe_id')->nullable()->constrained('employes')->nullOnDelete();
            $table->foreignId('appartement_id')->nullable()->constrained('appartements')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('equipements');
    }
};
