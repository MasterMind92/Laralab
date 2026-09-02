<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Lignes d'une commande (Phase 10).
     *
     * `besoin_id` est nullable et volontairement en `nullOnDelete` : une ligne peut naître
     * d'un besoin exprimé comme d'un ajout direct du logisticien, et la commande passée
     * reste un fait même si le besoin d'origine disparaît.
     *
     * `designation` et `prix_unitaire` sont RECOPIÉS depuis le besoin plutôt que lus à
     * travers la relation : une commande envoyée à un fournisseur est un engagement, elle
     * ne doit pas changer de contenu parce que quelqu'un a corrigé le libellé du besoin
     * après coup. Même principe que `facture_lignes`, figées à la génération du devis.
     */
    public function up(): void
    {
        Schema::create('commande_lignes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('commande_id')->constrained()->cascadeOnDelete();
            $table->foreignId('besoin_id')->nullable()->constrained('besoins')->nullOnDelete();
            $table->string('designation');
            $table->unsignedInteger('quantite')->default(1);
            $table->decimal('prix_unitaire', 10, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commande_lignes');
    }
};
