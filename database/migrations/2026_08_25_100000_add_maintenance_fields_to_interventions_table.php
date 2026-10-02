<?php

use App\Support\EnumColonne;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Phase 05 (Maintenance) : statut -> etape (8 valeurs, source de vérité unique —
     * la vue macro R9 est une méthode dérivée, jamais une colonne, voir
     * Intervention::statutMacro()). employe_id servait jusqu'ici à la fois au
     * déclarant (réceptionniste qui signale) et au technicien (qui répare) : éclaté
     * en deux colonnes explicites.
     *
     * L'enum est élargi avant le remappage des données puis restreint à sa forme finale.
     * Renommer et changer le jeu de valeurs d'un enum dans le même appel ne fonctionne
     * pas de façon fiable, d'où les étapes séparées. Changements d'enum via
     * EnumColonne::changer() — portable MySQL / SQLite / PostgreSQL (voir la classe).
     */
    public function up(): void
    {
        EnumColonne::changer('interventions', 'statut', ['signalee', 'en_cours', 'resolue', 'planifiee', 'technicien_affecte', 'reparee', 'controlee', 'cloturee', 'reformee'], 'signalee');

        DB::table('interventions')->where('statut', 'resolue')->update(['statut' => 'cloturee']);

        Schema::table('interventions', function (Blueprint $table) {
            $table->renameColumn('statut', 'etape');
        });

        EnumColonne::changer('interventions', 'etape', ['signalee', 'planifiee', 'technicien_affecte', 'en_cours', 'reparee', 'controlee', 'cloturee', 'reformee'], 'signalee');

        Schema::table('interventions', function (Blueprint $table) {
            $table->dropForeign(['employe_id']);
        });

        Schema::table('interventions', function (Blueprint $table) {
            $table->renameColumn('employe_id', 'declarant_employe_id');
        });

        Schema::table('interventions', function (Blueprint $table) {
            $table->foreign('declarant_employe_id')->references('id')->on('employes')->nullOnDelete();

            $table->foreignId('technicien_employe_id')->nullable()->after('declarant_employe_id')->constrained('employes')->nullOnDelete();

            $table->enum('priorite', ['basse', 'normale', 'haute', 'critique'])->default('normale')->after('description_panne');
            $table->dateTime('date_planifiee')->nullable()->after('date_signalement');
            $table->dateTime('date_prise_en_charge')->nullable()->after('date_planifiee');
            $table->dateTime('sla_echeance')->nullable()->after('date_prise_en_charge');

            // R5 : test de conformité obligatoire avant clôture.
            $table->enum('conformite_resultat', ['conforme', 'non_conforme'])->nullable()->after('date_resolution');
            $table->dateTime('conformite_testee_le')->nullable()->after('conformite_resultat');
            $table->foreignId('conformite_employe_id')->nullable()->after('conformite_testee_le')->constrained('employes')->nullOnDelete();

            // R6 : réforme.
            $table->text('motif_reforme')->nullable()->after('conformite_employe_id');
            $table->decimal('cout_reparation_estime', 10, 2)->nullable()->after('motif_reforme');

            // R7 : garantie figée à la déclaration — ne doit jamais être recalculée rétroactivement.
            $table->boolean('sous_garantie')->default(false)->after('cout_reparation_estime');

            // Dénormalisé depuis intervention_actions.cout (voir Intervention::recalculerCout()).
            $table->decimal('cout_total', 10, 2)->default(0)->after('sous_garantie');
        });
    }

    public function down(): void
    {
        Schema::table('interventions', function (Blueprint $table) {
            $table->dropColumn(['cout_total', 'sous_garantie', 'cout_reparation_estime', 'motif_reforme']);
            $table->dropConstrainedForeignId('conformite_employe_id');
            $table->dropColumn(['conformite_testee_le', 'conformite_resultat']);
            $table->dropColumn(['sla_echeance', 'date_prise_en_charge', 'date_planifiee', 'priorite']);
            $table->dropConstrainedForeignId('technicien_employe_id');
        });

        Schema::table('interventions', function (Blueprint $table) {
            $table->dropForeign(['declarant_employe_id']);
        });

        Schema::table('interventions', function (Blueprint $table) {
            $table->renameColumn('declarant_employe_id', 'employe_id');
        });

        Schema::table('interventions', function (Blueprint $table) {
            $table->foreign('employe_id')->references('id')->on('employes')->nullOnDelete();
        });

        // Élargi d'abord : 'resolue' ne fait plus partie de l'enum `etape`.
        EnumColonne::changer('interventions', 'etape', ['signalee', 'en_cours', 'resolue', 'planifiee', 'technicien_affecte', 'reparee', 'controlee', 'cloturee', 'reformee'], 'signalee');

        DB::table('interventions')->whereIn('etape', ['cloturee', 'reformee'])->update(['etape' => 'resolue']);
        DB::table('interventions')->whereIn('etape', ['reparee', 'controlee'])->update(['etape' => 'en_cours']);
        DB::table('interventions')->whereIn('etape', ['planifiee', 'technicien_affecte'])->update(['etape' => 'signalee']);

        Schema::table('interventions', function (Blueprint $table) {
            $table->renameColumn('etape', 'statut');
        });

        EnumColonne::changer('interventions', 'statut', ['signalee', 'en_cours', 'resolue'], 'signalee');
    }
};
