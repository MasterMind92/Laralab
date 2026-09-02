<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ce qui a réellement été reçu, ligne de commande par ligne de commande (Phase 10).
     *
     * `quantite_recue` peut dépasser la quantité commandée (le fournisseur livre plus) ou
     * rester en deçà : aucune contrainte ne l'interdit ici, parce que la table décrit un
     * FAIT constaté au quai, pas ce qui aurait dû arriver. C'est l'écran de réception qui
     * signale l'écart, et `motif_ecart` qui l'explique.
     *
     * `quantite_enregistree` compte les équipements déjà créés depuis cette ligne : c'est
     * le compteur qui empêche d'enregistrer deux fois la même livraison, et qui alimente
     * la file de l'écran « Enregistrement ».
     */
    public function up(): void
    {
        Schema::create('reception_lignes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reception_id')->constrained()->cascadeOnDelete();
            $table->foreignId('commande_ligne_id')->constrained('commande_lignes')->cascadeOnDelete();
            $table->unsignedInteger('quantite_recue')->default(0);
            $table->unsignedInteger('quantite_enregistree')->default(0);
            $table->boolean('conforme')->default(true);
            $table->text('motif_ecart')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reception_lignes');
    }
};
