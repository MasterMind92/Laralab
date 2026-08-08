<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Un devis (facture en brouillon) n'a pas encore de numéro — attribué seulement
     * à la validation par la comptabilité. DB::statement plutôt que ->change() pour
     * ne pas ajouter doctrine/dbal pour un seul changement de colonne.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE factures MODIFY numero_facture VARCHAR(255) NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE factures MODIFY numero_facture VARCHAR(255) NOT NULL');
    }
};
