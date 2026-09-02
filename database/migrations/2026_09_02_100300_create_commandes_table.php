<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Commande fournisseur (Phase 10). Les six statuts du cadrage du 2026-08-24.
     *
     * `partiellement_recue` et `recue` ne sont JAMAIS choisis à la main : ils sont dérivés
     * des quantités réellement réceptionnées (`Commande::recalculerStatut()`). Une
     * commande ne modifie jamais le stock directement — seule une réception le fait, et
     * c'est elle qui fait avancer la commande, pas l'inverse.
     *
     * Pas de colonne `montant_total` : elle serait une copie de la somme des lignes, donc
     * une seconde vérité à maintenir. Même raisonnement que `interventions.cout_total`,
     * qui n'est écrit que par `recalculerCout()` — sauf qu'ici la somme est assez peu
     * coûteuse pour être calculée à la demande.
     */
    public function up(): void
    {
        Schema::create('commandes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entreprise_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('fournisseur_id')->nullable()->constrained('fournisseurs')->nullOnDelete();
            // Nullable a l'insertion seulement : la reference est derivee de l'id, donc
            // ecrite juste apres la creation (voir Commande::booted()). La deduire d'un
            // max(id)+1 calcule AVANT l'insertion serait une course, et deux commandes
            // creees simultanement violeraient l'unicite.
            $table->string('reference')->nullable()->unique();
            $table->enum('statut', [
                'brouillon', 'envoyee', 'confirmee', 'partiellement_recue', 'recue', 'annulee',
            ])->default('brouillon');
            $table->date('date_commande')->nullable();
            $table->date('date_livraison_prevue')->nullable();
            $table->text('notes')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['entreprise_id', 'statut']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commandes');
    }
};
