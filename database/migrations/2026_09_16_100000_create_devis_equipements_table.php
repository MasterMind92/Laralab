<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Le devis équipement (extension Phase 06) — ce que la plateforme facture au
     * Propriétaire pour l'équipement durable acheté pour son compte.
     *
     * Généré automatiquement à l'ENREGISTREMENT (`LogistiqueController::enregistrer()`),
     * pas à la Réception : c'est le seul moment où l'on sait qu'une ligne produit un
     * `Equipement`, donc qu'elle est durable — voir `FactureFournisseurLigne.nature` pour
     * la même logique côté Achats. `reception_id` porte le regroupement (un devis par
     * réception, dans le cas courant).
     *
     * Cycle calqué sur `factures_fournisseur` : `statut`, `valide_par_id` et les dates de
     * validation/paiement sont ABSENTS de Fillable, écrits uniquement par `valider()` /
     * `payer()` / `annuler()` / `renvoyerEnValidation()`.
     *
     * `majoration_active` + `taux_majoration` sont un choix PAR DEVIS (décidé par la
     * Comptabilité au cas par cas), pas un réglage global comme
     * `ParametreFacturation.frais_service_actif` — décision actée le 2026-09-16.
     */
    public function up(): void
    {
        Schema::create('devis_equipements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entreprise_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('reception_id')->constrained('receptions')->cascadeOnDelete();

            $table->enum('statut', ['brouillon', 'validee', 'payee', 'annulee'])->default('brouillon');

            $table->boolean('majoration_active')->default(false);
            $table->decimal('taux_majoration', 8, 4)->nullable();

            $table->foreignId('valide_par_id')->nullable()->constrained('employes')->nullOnDelete();
            $table->date('date_validation')->nullable();

            $table->date('date_paiement')->nullable();
            $table->enum('mode_paiement', ['especes', 'virement', 'mobile_money', 'cheque'])->nullable();
            $table->string('reference_paiement')->nullable();
            $table->text('motif_rejet')->nullable();

            $table->text('notes')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['entreprise_id', 'statut']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devis_equipements');
    }
};
