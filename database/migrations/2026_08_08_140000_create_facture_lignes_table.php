<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Snapshot figé au moment de la génération du devis/facture : les prix affichés
     * ne doivent jamais bouger rétroactivement si l'appartement/les tarifs changent
     * après coup. Régénérer un brouillon supprime et recrée ces lignes.
     */
    public function up(): void
    {
        Schema::create('facture_lignes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('facture_id')->constrained('factures')->cascadeOnDelete();
            $table->enum('type', ['hebergement', 'reduction', 'service', 'dommage', 'frais_service']);
            $table->string('designation');
            $table->integer('quantite')->default(1);
            $table->decimal('prix_unitaire', 10, 2);
            $table->decimal('montant', 10, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('facture_lignes');
    }
};
