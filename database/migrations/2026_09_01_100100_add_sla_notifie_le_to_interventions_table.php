<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Phase 12 : l'alerte de dépassement SLA est produite par une commande planifiée qui
     * balaie les interventions ouvertes (le dépassement n'est pas un événement, c'est du
     * temps qui passe). Sans marqueur, chaque passage de l'ordonnanceur renotifierait les
     * mêmes dossiers indéfiniment.
     *
     * Un horodatage plutôt qu'un booléen : il dit AUSSI quand l'alerte est partie, ce qui
     * permettra plus tard une relance d'escalade sans nouvelle migration. Volontairement
     * porté par l'intervention et non déduit d'une requête JSON sur `notifications.data` —
     * explicite, indexable, et lisible par quiconque ouvre la table.
     */
    public function up(): void
    {
        Schema::table('interventions', function (Blueprint $table) {
            $table->dateTime('sla_notifie_le')->nullable()->after('sla_echeance');
        });
    }

    public function down(): void
    {
        Schema::table('interventions', function (Blueprint $table) {
            $table->dropColumn('sla_notifie_le');
        });
    }
};
