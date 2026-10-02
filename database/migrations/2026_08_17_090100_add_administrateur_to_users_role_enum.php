<?php

use App\Support\EnumColonne;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Ajoute le role vendeur "administrateur" (multi-tenant, Phase 09) — enum. `->change()`
     * ne necessite PAS doctrine/dbal dans cette version de Laravel (verifie sur MySQL et
     * SQLite, 2026-09-17) — portable sur les deux pilotes.
     */
    public function up(): void
    {
        EnumColonne::changer('users', 'role', ['administrateur', 'proprietaire', 'gerant', 'commercial', 'rh', 'compta', 'logistique', 'maintenance', 'receptionniste', 'client'], 'client');
    }

    public function down(): void
    {
        EnumColonne::changer('users', 'role', ['proprietaire', 'gerant', 'commercial', 'rh', 'compta', 'logistique', 'maintenance', 'receptionniste', 'client'], 'client');
    }
};
