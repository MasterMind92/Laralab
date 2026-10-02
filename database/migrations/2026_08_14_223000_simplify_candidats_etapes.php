<?php

use App\Support\EnumColonne;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Pipeline candidat simplifié de 8 à 5 étapes (recu/a_analyser -> recu,
     * preselectionne/entretien -> entretien, evaluation/retenu -> decision).
     * L'enum est élargi avant le remappage des données, puis restreint à sa
     * forme finale, pour ne jamais avoir de valeur hors-enum en transit.
     * EnumColonne::changer() plutôt que `enum()->change()` : ce dernier génère du SQL
     * invalide sur PostgreSQL (voir la classe) — portable MySQL / SQLite / PostgreSQL.
     */
    public function up(): void
    {
        EnumColonne::changer('candidats', 'etape', ['recu', 'a_analyser', 'preselectionne', 'entretien', 'evaluation', 'retenu', 'offre', 'embauche', 'decision'], 'recu');

        DB::table('candidats')->update(['etape' => DB::raw("CASE etape
            WHEN 'a_analyser' THEN 'recu'
            WHEN 'preselectionne' THEN 'entretien'
            WHEN 'evaluation' THEN 'decision'
            WHEN 'retenu' THEN 'decision'
            ELSE etape
        END")]);

        EnumColonne::changer('candidats', 'etape', ['recu', 'entretien', 'decision', 'offre', 'embauche'], 'recu');
    }

    public function down(): void
    {
        EnumColonne::changer('candidats', 'etape', ['recu', 'a_analyser', 'preselectionne', 'entretien', 'evaluation', 'retenu', 'offre', 'embauche', 'decision'], 'recu');

        DB::table('candidats')->where('etape', 'decision')->update(['etape' => 'evaluation']);

        EnumColonne::changer('candidats', 'etape', ['recu', 'a_analyser', 'preselectionne', 'entretien', 'evaluation', 'retenu', 'offre', 'embauche'], 'recu');
    }
};
