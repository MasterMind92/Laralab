<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Un devis (facture en brouillon) n'a pas encore de numéro — attribué seulement
     * à la validation par la comptabilité. `->change()` ne nécessite PAS doctrine/dbal
     * dans cette version de Laravel (vérifié sur MySQL et SQLite, 2026-09-17) —
     * portable sur les deux pilotes, contrairement au `DB::statement` brut d'avant.
     */
    public function up(): void
    {
        Schema::table('factures', function (Blueprint $table) {
            $table->string('numero_facture')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('factures', function (Blueprint $table) {
            $table->string('numero_facture')->nullable(false)->change();
        });
    }
};
