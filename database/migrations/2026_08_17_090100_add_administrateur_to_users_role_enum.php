<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Ajoute le role vendeur "administrateur" (multi-tenant, Phase 09) — enum MySQL,
     * DB::statement plutot que ->change() pour ne pas ajouter doctrine/dbal.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE users MODIFY role ENUM('administrateur','proprietaire','gerant','commercial','rh','compta','logistique','maintenance','receptionniste','client') NOT NULL DEFAULT 'client'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE users MODIFY role ENUM('proprietaire','gerant','commercial','rh','compta','logistique','maintenance','receptionniste','client') NOT NULL DEFAULT 'client'");
    }
};
