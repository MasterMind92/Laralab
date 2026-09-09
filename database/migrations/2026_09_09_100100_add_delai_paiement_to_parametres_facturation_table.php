<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Délai de paiement accordé au client (Phase 06).
     *
     * Jusqu'ici `FactureController::valider()` écrivait `date_echeance = now()` : toute
     * facture était donc exigible le jour même de sa validation, et un écran de
     * recouvrement bâti là-dessus aurait déclaré tout le monde en retard dès la première
     * seconde. L'échéance devient `date de validation + délai`.
     *
     * Réglable par entreprise, comme la TVA et l'acompte : 30 jours est un usage courant,
     * pas une règle.
     */
    public function up(): void
    {
        Schema::table('parametres_facturation', function (Blueprint $table) {
            $table->unsignedSmallInteger('delai_paiement_jours')->default(30)->after('acompte_actif');
        });
    }

    public function down(): void
    {
        Schema::table('parametres_facturation', function (Blueprint $table) {
            $table->dropColumn('delai_paiement_jours');
        });
    }
};
