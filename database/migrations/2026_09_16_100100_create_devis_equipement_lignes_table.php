<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Une ligne de devis équipement (extension Phase 06), une par `ReceptionLigne`
     * enregistrée. `quantite` porte le cumul `quantite_enregistree` de la ligne de
     * réception au moment de l'écriture — un enregistrement partiel suivi d'un
     * complément met à jour la même ligne plutôt que d'en ajouter une seconde.
     *
     * La contrainte unique sur `['devis_equipement_id', 'reception_ligne_id']` est ce qui
     * rend `updateOrCreate()` idempotent côté `LogistiqueController::enregistrer()`.
     */
    public function up(): void
    {
        Schema::create('devis_equipement_lignes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('devis_equipement_id')->constrained('devis_equipements')->cascadeOnDelete();
            $table->foreignId('reception_ligne_id')->nullable()->constrained('reception_lignes')->nullOnDelete();

            $table->string('designation');
            $table->unsignedInteger('quantite')->default(1);
            $table->decimal('prix_unitaire', 12, 2)->default(0);

            $table->timestamps();

            // Nom explicite : le nom auto-genere depasse la limite MySQL de 64 caracteres.
            $table->unique(['devis_equipement_id', 'reception_ligne_id'], 'devis_equipement_lignes_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devis_equipement_lignes');
    }
};
