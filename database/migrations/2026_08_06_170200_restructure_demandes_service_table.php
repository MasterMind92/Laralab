<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Une demande de service concerne toujours un appartement, mais plus forcément un
     * séjour actif (ex. réapprovisionnement entre deux réservations) — sejour_id devient
     * nullable. appartement_id reste nullable au niveau base (validé côté application)
     * pour ne pas casser un environnement où la table contiendrait déjà des lignes.
     */
    public function up(): void
    {
        Schema::table('demandes_service', function (Blueprint $table) {
            $table->foreignId('appartement_id')->nullable()->after('sejour_id')
                ->constrained('appartements')->nullOnDelete();
            $table->foreignId('partenaire_id')->nullable()->after('appartement_id')
                ->constrained('partenaires')->nullOnDelete();
        });

        Schema::table('demandes_service', function (Blueprint $table) {
            $table->dropForeign(['sejour_id']);
        });

        // ->change() ne necessite pas doctrine/dbal dans cette version de Laravel
        // (verifie sur MySQL et SQLite, 2026-09-17) — portable sur les deux pilotes.
        Schema::table('demandes_service', function (Blueprint $table) {
            $table->foreignId('sejour_id')->nullable()->change();
        });

        Schema::table('demandes_service', function (Blueprint $table) {
            $table->foreign('sejour_id')->references('id')->on('sejours')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('demandes_service', function (Blueprint $table) {
            $table->dropForeign(['sejour_id']);
            $table->dropForeign(['appartement_id']);
            $table->dropForeign(['partenaire_id']);
            $table->dropColumn(['appartement_id', 'partenaire_id']);
        });

        Schema::table('demandes_service', function (Blueprint $table) {
            $table->foreignId('sejour_id')->nullable(false)->change();
        });

        Schema::table('demandes_service', function (Blueprint $table) {
            $table->foreign('sejour_id')->references('id')->on('sejours')->cascadeOnDelete();
        });
    }
};
