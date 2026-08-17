<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * parametres_facturation etait une ligne singleton globale (ParametreFacturation::actuel()
     * faisait firstOrCreate([])) — une fois compta scope par entreprise, laisser ce reglage
     * global permettrait a la compta d'une entreprise de modifier le taux TVA/acompte de
     * toutes les autres. Une ligne de parametres par entreprise desormais (index unique).
     */
    public function up(): void
    {
        Schema::table('parametres_facturation', function (Blueprint $table) {
            $table->foreignId('entreprise_id')->nullable()->unique()->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('parametres_facturation', function (Blueprint $table) {
            $table->dropConstrainedForeignId('entreprise_id');
        });
    }
};
