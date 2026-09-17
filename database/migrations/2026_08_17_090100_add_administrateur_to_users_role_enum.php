<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ajoute le role vendeur "administrateur" (multi-tenant, Phase 09) — enum. `->change()`
     * ne necessite PAS doctrine/dbal dans cette version de Laravel (verifie sur MySQL et
     * SQLite, 2026-09-17) — portable sur les deux pilotes.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['administrateur', 'proprietaire', 'gerant', 'commercial', 'rh', 'compta', 'logistique', 'maintenance', 'receptionniste', 'client'])
                ->default('client')
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['proprietaire', 'gerant', 'commercial', 'rh', 'compta', 'logistique', 'maintenance', 'receptionniste', 'client'])
                ->default('client')
                ->change();
        });
    }
};
