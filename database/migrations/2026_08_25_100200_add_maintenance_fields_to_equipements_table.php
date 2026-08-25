<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * R6 (réforme) / R7 (garantie-contrat) : ces informations portent sur l'équipement
     * lui-même, pas sur une intervention ponctuelle — logées dans le futur 4e item de
     * menu "Parc équipements" (Phase 05, étape C).
     */
    public function up(): void
    {
        Schema::table('equipements', function (Blueprint $table) {
            $table->string('numero_serie')->nullable()->after('type');
            $table->date('garantie_fin')->nullable()->after('numero_serie');
            $table->boolean('contrat_maintenance')->default(false)->after('garantie_fin');
            $table->string('contrat_reference')->nullable()->after('contrat_maintenance');
            $table->date('contrat_echeance')->nullable()->after('contrat_reference');
            $table->date('date_reforme')->nullable()->after('contrat_echeance');
        });

        DB::statement("ALTER TABLE equipements MODIFY statut ENUM('stock','affecte','en_panne','reforme') NOT NULL DEFAULT 'stock'");
    }

    public function down(): void
    {
        DB::statement("UPDATE equipements SET statut = 'en_panne' WHERE statut = 'reforme'");
        DB::statement("ALTER TABLE equipements MODIFY statut ENUM('stock','affecte','en_panne') NOT NULL DEFAULT 'stock'");

        Schema::table('equipements', function (Blueprint $table) {
            $table->dropColumn(['date_reforme', 'contrat_echeance', 'contrat_reference', 'contrat_maintenance', 'garantie_fin', 'numero_serie']);
        });
    }
};
