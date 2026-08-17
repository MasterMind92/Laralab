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
        DB::statement('
            UPDATE demandes_service ds
            JOIN sejours s ON s.id = ds.sejour_id
            JOIN reservations r ON r.id = s.reservation_id
            SET ds.appartement_id = r.appartement_id
            WHERE ds.appartement_id IS NULL AND ds.sejour_id IS NOT NULL
        ');

        Schema::table('interventions', function (Blueprint $table) {
            $table->dropForeign(['appartement_id']);
        });
        DB::statement('ALTER TABLE interventions MODIFY appartement_id BIGINT UNSIGNED NOT NULL');
        Schema::table('interventions', function (Blueprint $table) {
            $table->foreign('appartement_id')->references('id')->on('appartements')->restrictOnDelete();
        });

        Schema::table('demandes_service', function (Blueprint $table) {
            $table->dropForeign(['appartement_id']);
        });
        DB::statement('ALTER TABLE demandes_service MODIFY appartement_id BIGINT UNSIGNED NOT NULL');
        Schema::table('demandes_service', function (Blueprint $table) {
            $table->foreign('appartement_id')->references('id')->on('appartements')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('interventions', function (Blueprint $table) {
            $table->dropForeign(['appartement_id']);
        });
        DB::statement('ALTER TABLE interventions MODIFY appartement_id BIGINT UNSIGNED NULL');
        Schema::table('interventions', function (Blueprint $table) {
            $table->foreign('appartement_id')->references('id')->on('appartements')->nullOnDelete();
        });

        Schema::table('demandes_service', function (Blueprint $table) {
            $table->dropForeign(['appartement_id']);
        });
        DB::statement('ALTER TABLE demandes_service MODIFY appartement_id BIGINT UNSIGNED NULL');
        Schema::table('demandes_service', function (Blueprint $table) {
            $table->foreign('appartement_id')->references('id')->on('appartements')->nullOnDelete();
        });
    }
};
