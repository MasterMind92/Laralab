<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Phase 11 (RH — Planification) : le maillon manquant entre une reservation
     * validee/cloturee et le travail d'entretien qu'elle implique. appartement_id porte
     * le rattachement entreprise (voir Tache::entrepriseRelationPath()).
     */
    public function up(): void
    {
        Schema::create('taches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appartement_id')->constrained('appartements')->cascadeOnDelete();
            $table->foreignId('reservation_id')->nullable()->constrained('reservations')->nullOnDelete();
            $table->foreignId('employe_assigne_id')->nullable()->constrained('employes')->nullOnDelete();
            $table->enum('type', ['nettoyage', 'linge', 'reassort', 'controle_general']);
            $table->enum('origine', ['auto_arrivee', 'auto_depart', 'manuelle'])->default('manuelle');
            $table->enum('priorite', ['basse', 'normale', 'haute'])->default('normale');
            $table->dateTime('date_prevue');
            $table->enum('statut', ['a_faire', 'en_cours', 'terminee', 'controlee'])->default('a_faire');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('taches');
    }
};
