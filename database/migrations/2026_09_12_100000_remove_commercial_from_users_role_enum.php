<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Retire le role "commercial" (Phase 07) : jamais cable a aucune route depuis sa
     * creation, donc inaccessible (403 immediat au premier ecran apres connexion). Le
     * pole correspondant existait dans App\Support\Poles mais n'a jamais eu d'ecran.
     *
     * Le compte de demo est supprime avant de retrecir l'enum : MySQL rejette toute
     * ligne dont la valeur sortirait du nouvel ensemble.
     */
    public function up(): void
    {
        DB::table('users')->where('role', 'commercial')->delete();

        DB::statement("ALTER TABLE users MODIFY role ENUM('administrateur','proprietaire','gerant','rh','compta','logistique','maintenance','receptionniste','client') NOT NULL DEFAULT 'client'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE users MODIFY role ENUM('administrateur','proprietaire','gerant','commercial','rh','compta','logistique','maintenance','receptionniste','client') NOT NULL DEFAULT 'client'");
    }
};
