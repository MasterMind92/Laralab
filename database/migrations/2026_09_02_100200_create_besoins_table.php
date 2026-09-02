<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Expression de besoin (Phase 10) — premier maillon de la chaîne
     * `Besoin → Commande → Réception → Enregistrement → Affectation`.
     *
     * `entreprise_id` porté en direct plutôt que déduit du demandeur : un besoin doit
     * rester cloisonné même si l'employé qui l'a exprimé quitte l'entreprise et voit sa
     * fiche supprimée (`demandeur_employe_id` est alors mis à NULL).
     *
     * `appartement_id` est la destination PRÉVUE, pas une affectation : elle documente le
     * motif de la demande et n'engage rien — l'affectation réelle a lieu bien plus tard,
     * sur l'équipement enregistré.
     */
    public function up(): void
    {
        Schema::create('besoins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entreprise_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('demandeur_employe_id')->nullable()->constrained('employes')->nullOnDelete();
            $table->foreignId('appartement_id')->nullable()->constrained()->nullOnDelete();
            $table->string('designation');
            $table->unsignedInteger('quantite')->default(1);
            $table->text('justification')->nullable();
            $table->enum('priorite', ['basse', 'normale', 'haute'])->default('normale');
            $table->enum('statut', ['brouillon', 'soumis', 'valide', 'refuse', 'commande'])->default('brouillon');
            $table->foreignId('valide_par_id')->nullable()->constrained('employes')->nullOnDelete();
            $table->date('date_validation')->nullable();
            $table->text('motif_refus')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['entreprise_id', 'statut']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('besoins');
    }
};
