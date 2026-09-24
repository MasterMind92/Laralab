<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Quatre familles de charges trop fines pour tenir dans `services_exterieurs` :
     * l'eau et le courant sont des postes récurrents que le propriétaire veut suivre
     * séparément (deux fournisseurs, deux factures), et la réparation (prestation
     * ponctuelle sur panne) n'est pas l'entretien (contrat récurrent) même si les
     * deux relevaient jusqu'ici du même fourre-tout.
     *
     * Les 6 familles OHADA de la Phase 06 restent : on étend la nomenclature, on ne
     * la remplace pas — `achats_consommables` et `charges_financieres` continuent de
     * servir aux Achats fournisseurs, qui n'ont pas d'équivalent dans les 4 nouvelles.
     */
    public function up(): void
    {
        Schema::table('facture_fournisseur_lignes', function (Blueprint $table) {
            $table->enum('categorie', [
                'achats_consommables',
                'services_exterieurs',
                'eau',
                'courant',
                'entretien',
                'reparation',
                'personnel',
                'impots_taxes',
                'charges_financieres',
                'autres',
            ])->nullable()->change();
        });

        Schema::table('depenses', function (Blueprint $table) {
            $table->enum('categorie', [
                'achats_consommables',
                'services_exterieurs',
                'eau',
                'courant',
                'entretien',
                'reparation',
                'personnel',
                'impots_taxes',
                'charges_financieres',
                'autres',
            ])->default('autres')->change();
        });
    }

    public function down(): void
    {
        Schema::table('facture_fournisseur_lignes', function (Blueprint $table) {
            $table->enum('categorie', [
                'achats_consommables',
                'services_exterieurs',
                'personnel',
                'impots_taxes',
                'charges_financieres',
                'autres',
            ])->nullable()->change();
        });

        Schema::table('depenses', function (Blueprint $table) {
            $table->enum('categorie', [
                'achats_consommables',
                'services_exterieurs',
                'personnel',
                'impots_taxes',
                'charges_financieres',
                'autres',
            ])->default('autres')->change();
        });
    }
};
