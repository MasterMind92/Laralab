<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Pipeline candidat simplifié de 8 à 5 étapes (recu/a_analyser -> recu,
     * preselectionne/entretien -> entretien, evaluation/retenu -> decision).
     * L'enum est élargi avant le remappage des données, puis restreint à sa
     * forme finale, pour ne jamais avoir de valeur hors-enum en transit.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE candidats MODIFY etape ENUM('recu','a_analyser','preselectionne','entretien','evaluation','retenu','offre','embauche','decision') NOT NULL DEFAULT 'recu'");

        DB::statement("UPDATE candidats SET etape = CASE etape
            WHEN 'a_analyser' THEN 'recu'
            WHEN 'preselectionne' THEN 'entretien'
            WHEN 'evaluation' THEN 'decision'
            WHEN 'retenu' THEN 'decision'
            ELSE etape
        END");

        DB::statement("ALTER TABLE candidats MODIFY etape ENUM('recu','entretien','decision','offre','embauche') NOT NULL DEFAULT 'recu'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE candidats MODIFY etape ENUM('recu','a_analyser','preselectionne','entretien','evaluation','retenu','offre','embauche','decision') NOT NULL DEFAULT 'recu'");

        DB::statement("UPDATE candidats SET etape = CASE etape
            WHEN 'decision' THEN 'evaluation'
            ELSE etape
        END");

        DB::statement("ALTER TABLE candidats MODIFY etape ENUM('recu','a_analyser','preselectionne','entretien','evaluation','retenu','offre','embauche') NOT NULL DEFAULT 'recu'");
    }
};
