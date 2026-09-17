<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Retire le role "commercial" (Phase 07) : jamais cable a aucune route depuis sa
     * creation, donc inaccessible (403 immediat au premier ecran apres connexion). Le
     * pole correspondant existait dans App\Support\Poles mais n'a jamais eu d'ecran.
     *
     * Le compte de demo est supprime avant de retrecir l'enum : meme sans contrainte
     * stricte partout, une ligne dont la valeur sortirait du nouvel ensemble ne doit
     * pas rester en base. `->change()` ne necessite PAS doctrine/dbal dans cette
     * version de Laravel (verifie sur MySQL et SQLite, 2026-09-17).
     */
    public function up(): void
    {
        DB::table('users')->where('role', 'commercial')->delete();

        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['administrateur', 'proprietaire', 'gerant', 'rh', 'compta', 'logistique', 'maintenance', 'receptionniste', 'client'])
                ->default('client')
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['administrateur', 'proprietaire', 'gerant', 'commercial', 'rh', 'compta', 'logistique', 'maintenance', 'receptionniste', 'client'])
                ->default('client')
                ->change();
        });
    }
};
