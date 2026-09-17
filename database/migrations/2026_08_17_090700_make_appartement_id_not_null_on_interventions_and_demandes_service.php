<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * appartement_id etait nullable en base sur ces deux tables ("valide cote
     * application" selon le commentaire de 2026_08_06_170200) — invisible pour un
     * role scope entreprise si null, mais reste visible pour administrateur.
     * Backfill des lignes orphelines via leur sejour->reservation->appartement,
     * puis bascule nullOnDelete -> restrictOnDelete (MySQL refuse NOT NULL tant
     * que la contrainte FK existante prevoit SET NULL) (Phase 09, multi-tenant).
     */
    public function up(): void
    {
        // Sous-requete correlee plutot que UPDATE...JOIN (syntaxe MySQL-only) — portable,
        // verifie sur SQLite et standard sur MySQL (2026-09-17).
        DB::statement('
            UPDATE demandes_service
            SET appartement_id = (
                SELECT r.appartement_id
                FROM sejours s
                JOIN reservations r ON r.id = s.reservation_id
                WHERE s.id = demandes_service.sejour_id
            )
            WHERE appartement_id IS NULL AND sejour_id IS NOT NULL
        ');

        Schema::table('interventions', function (Blueprint $table) {
            $table->dropForeign(['appartement_id']);
        });
        // ->change() ne necessite pas doctrine/dbal dans cette version de Laravel
        // (verifie sur MySQL et SQLite, 2026-09-17) — portable sur les deux pilotes.
        Schema::table('interventions', function (Blueprint $table) {
            $table->foreignId('appartement_id')->nullable(false)->change();
        });
        Schema::table('interventions', function (Blueprint $table) {
            $table->foreign('appartement_id')->references('id')->on('appartements')->restrictOnDelete();
        });

        Schema::table('demandes_service', function (Blueprint $table) {
            $table->dropForeign(['appartement_id']);
        });
        Schema::table('demandes_service', function (Blueprint $table) {
            $table->foreignId('appartement_id')->nullable(false)->change();
        });
        Schema::table('demandes_service', function (Blueprint $table) {
            $table->foreign('appartement_id')->references('id')->on('appartements')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('interventions', function (Blueprint $table) {
            $table->dropForeign(['appartement_id']);
        });
        Schema::table('interventions', function (Blueprint $table) {
            $table->foreignId('appartement_id')->nullable()->change();
        });
        Schema::table('interventions', function (Blueprint $table) {
            $table->foreign('appartement_id')->references('id')->on('appartements')->nullOnDelete();
        });

        Schema::table('demandes_service', function (Blueprint $table) {
            $table->dropForeign(['appartement_id']);
        });
        Schema::table('demandes_service', function (Blueprint $table) {
            $table->foreignId('appartement_id')->nullable()->change();
        });
        Schema::table('demandes_service', function (Blueprint $table) {
            $table->foreign('appartement_id')->references('id')->on('appartements')->nullOnDelete();
        });
    }
};
