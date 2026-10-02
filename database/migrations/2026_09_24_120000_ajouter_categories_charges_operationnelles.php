<?php

use App\Support\EnumColonne;
use Illuminate\Database\Migrations\Migration;

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
        EnumColonne::changer('facture_fournisseur_lignes', 'categorie', [
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
        ], nullable: true);

        EnumColonne::changer('depenses', 'categorie', [
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
        ], 'autres');
    }

    public function down(): void
    {
        EnumColonne::changer('facture_fournisseur_lignes', 'categorie', [
            'achats_consommables',
            'services_exterieurs',
            'personnel',
            'impots_taxes',
            'charges_financieres',
            'autres',
        ], nullable: true);

        EnumColonne::changer('depenses', 'categorie', [
            'achats_consommables',
            'services_exterieurs',
            'personnel',
            'impots_taxes',
            'charges_financieres',
            'autres',
        ], 'autres');
    }
};
