<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pipeline candidat simplifié de 8 à 5 étapes (recu/a_analyser -> recu,
     * preselectionne/entretien -> entretien, evaluation/retenu -> decision).
     * L'enum est élargi avant le remappage des données, puis restreint à sa
     * forme finale, pour ne jamais avoir de valeur hors-enum en transit.
     * `->change()` ne nécessite PAS doctrine/dbal dans cette version de Laravel
     * (vérifié sur MySQL et SQLite, 2026-09-17) — portable sur les deux pilotes.
     */
    public function up(): void
    {
        Schema::table('candidats', function (Blueprint $table) {
            $table->enum('etape', ['recu', 'a_analyser', 'preselectionne', 'entretien', 'evaluation', 'retenu', 'offre', 'embauche', 'decision'])
                ->default('recu')
                ->change();
        });

        DB::statement("UPDATE candidats SET etape = CASE etape
            WHEN 'a_analyser' THEN 'recu'
            WHEN 'preselectionne' THEN 'entretien'
            WHEN 'evaluation' THEN 'decision'
            WHEN 'retenu' THEN 'decision'
            ELSE etape
        END");

        Schema::table('candidats', function (Blueprint $table) {
            $table->enum('etape', ['recu', 'entretien', 'decision', 'offre', 'embauche'])
                ->default('recu')
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('candidats', function (Blueprint $table) {
            $table->enum('etape', ['recu', 'a_analyser', 'preselectionne', 'entretien', 'evaluation', 'retenu', 'offre', 'embauche', 'decision'])
                ->default('recu')
                ->change();
        });

        DB::statement("UPDATE candidats SET etape = CASE etape
            WHEN 'decision' THEN 'evaluation'
            ELSE etape
        END");

        Schema::table('candidats', function (Blueprint $table) {
            $table->enum('etape', ['recu', 'a_analyser', 'preselectionne', 'entretien', 'evaluation', 'retenu', 'offre', 'embauche'])
                ->default('recu')
                ->change();
        });
    }
};
