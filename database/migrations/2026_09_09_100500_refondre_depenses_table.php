<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Remise à niveau de `depenses` (Phase 06). La table date de la Phase 00 et n'a jamais
     * servi — aucun écran, aucun contrôleur, zéro ligne. Trois manques la rendaient
     * inutilisable telle quelle.
     *
     * 1. PAS D'`entreprise_id`. Créée avant le multi-tenant (Phase 09), elle aurait montré
     *    les dépenses de chaque entreprise à toutes les autres dès le premier écran. Ce
     *    n'est pas une amélioration mais une correction : la colonne arrive avec son trait
     *    de cloisonnement automatique.
     *
     * 2. UNE CATÉGORIE QUI N'EN EST PAS UNE. `achats, salaires, maintenance, fournitures`
     *    mélangeait une famille d'achat, une nature de charge et une DESTINATION —
     *    « maintenance » pouvant désigner aussi bien une prestation extérieure qu'une
     *    pièce durable. On ne bâtit pas un compte de résultat là-dessus. Le nouvel
     *    ensemble suit les familles de charges du plan OHADA (classe 6), sans prétendre
     *    reproduire un plan comptable complet.
     *
     * 3. AUCUNE ORIGINE. Une dépense tombait du ciel. Elle pointe désormais vers la ligne
     *    de facture fournisseur qui l'a produite, quand elle en a une — les charges
     *    saisies à la main (petite caisse) n'en ont pas.
     *
     * La table est vide : la conversion d'enum ne peut perdre aucune donnée.
     */
    public function up(): void
    {
        Schema::table('depenses', function (Blueprint $table) {
            $table->foreignId('entreprise_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->foreignId('facture_fournisseur_ligne_id')
                ->nullable()
                ->after('valideur_id')
                ->constrained('facture_fournisseur_lignes')
                ->nullOnDelete();
            $table->softDeletes();
            $table->index(['entreprise_id', 'date_depense']);
        });

        // ->change() ne necessite pas doctrine/dbal dans cette version de Laravel
        // (verifie sur MySQL et SQLite, 2026-09-17) — portable sur les deux pilotes.
        Schema::table('depenses', function (Blueprint $table) {
            $table->enum('categorie', ['achats_consommables', 'services_exterieurs', 'personnel', 'impots_taxes', 'charges_financieres', 'autres'])
                ->default('autres')
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('depenses', function (Blueprint $table) {
            $table->enum('categorie', ['achats', 'salaires', 'maintenance', 'fournitures'])->change();
        });

        Schema::table('depenses', function (Blueprint $table) {
            $table->dropIndex(['entreprise_id', 'date_depense']);
            $table->dropConstrainedForeignId('facture_fournisseur_ligne_id');
            $table->dropConstrainedForeignId('entreprise_id');
            $table->dropSoftDeletes();
        });
    }
};
