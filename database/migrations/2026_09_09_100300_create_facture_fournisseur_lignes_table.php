<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Le détail d'une facture fournisseur (Phase 06) — et le seul endroit du projet où se
     * décide la NATURE comptable d'un achat.
     *
     * `nature` tranche entre charge et immobilisation. La ligne de partage n'est pas
     * « matériel ou immatériel » mais « consommé dans l'exercice ou durable » :
     *
     *   - un service (électricité, honoraires, prestation)      → charge
     *   - un bien matériel consommé (linge, produits d'entretien) → charge aussi
     *   - un bien matériel durable (climatiseur, matelas)        → IMMOBILISATION
     *
     * La conséquence pratique est ce qui a justifié ce champ : tout ce qui traverse la
     * chaîne logistique devient un `Equipement` porteur d'un numéro de série, d'une
     * garantie et d'une date de réforme — la signature d'un bien durable. Écrire une
     * dépense de 250 000 FCFA au paiement du climatiseur imputerait à un mois un bien qui
     * servira cinq ans, et le compte de résultat mentirait.
     *
     * L'amortissement n'est PAS calculé en Phase 06 (décision du 2026-09-09) : on
     * enregistre la nature, pour que les états financiers distinguent les charges de
     * l'exercice des montants immobilisés au lieu de tout empiler. L'ajouter plus tard
     * sera une addition, pas une reprise.
     *
     * `categorie` ne vaut que pour les lignes de nature `charge` — une immobilisation
     * n'est pas une charge, elle n'a donc pas de famille de charge.
     */
    public function up(): void
    {
        Schema::create('facture_fournisseur_lignes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('facture_fournisseur_id')->constrained('factures_fournisseur')->cascadeOnDelete();

            // Traçabilité vers ce qui avait été commandé, quand la ligne vient de la
            // chaîne logistique. Nullable pour les mêmes raisons que `commande_id`.
            $table->foreignId('commande_ligne_id')->nullable()->constrained('commande_lignes')->nullOnDelete();

            $table->string('designation');
            $table->unsignedInteger('quantite')->default(1);
            $table->decimal('prix_unitaire', 12, 2)->default(0);

            $table->enum('nature', ['charge', 'immobilisation'])->default('charge');
            $table->enum('categorie', [
                'achats_consommables',
                'services_exterieurs',
                'personnel',
                'impots_taxes',
                'charges_financieres',
                'autres',
            ])->nullable();

            $table->timestamps();

            $table->index(['facture_fournisseur_id', 'nature']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('facture_fournisseur_lignes');
    }
};
