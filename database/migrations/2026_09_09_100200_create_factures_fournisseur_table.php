<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * La facture fournisseur (Phase 06) — l'écran « Achats » du menu Comptabilité.
     *
     * C'est l'ÉVÉNEMENT comptable : qui l'on doit, combien, à quelle échéance. Ce que la
     * dépense devient ensuite — charge de l'exercice ou immobilisation portée à l'actif —
     * se décide LIGNE PAR LIGNE (voir la table suivante), parce qu'une même facture porte
     * couramment les deux : un climatiseur et sa pose.
     *
     * `commande_id` est NULLABLE et c'est délibéré. Toutes les dépenses ne passent pas par
     * la chaîne logistique : un loyer, des honoraires, une facture d'électricité n'ont
     * jamais eu de bon de commande. Exiger le lien obligerait à fabriquer des commandes
     * fictives pour faire entrer ces factures.
     *
     * Aucun montant n'est stocké : le total se dérive des lignes, comme sur `commandes`.
     * Une colonne `montant_total` serait une seconde vérité à tenir à jour à chaque
     * modification de ligne.
     */
    public function up(): void
    {
        Schema::create('factures_fournisseur', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entreprise_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('fournisseur_id')->nullable()->constrained('fournisseurs')->nullOnDelete();
            $table->foreignId('commande_id')->nullable()->constrained('commandes')->nullOnDelete();

            // La référence du FOURNISSEUR, recopiée telle qu'elle figure sur son document —
            // c'est elle qui sert à dialoguer avec lui en cas de litige. Non unique : deux
            // fournisseurs peuvent numéroter pareil.
            $table->string('reference')->nullable();

            $table->date('date_facture');
            $table->date('date_echeance')->nullable();

            $table->enum('statut', ['a_valider', 'validee', 'payee', 'annulee'])->default('a_valider');
            $table->text('motif_rejet')->nullable();

            $table->foreignId('valide_par_id')->nullable()->constrained('employes')->nullOnDelete();
            $table->date('date_validation')->nullable();

            $table->date('date_paiement')->nullable();
            $table->enum('mode_paiement', ['especes', 'virement', 'mobile_money', 'cheque'])->nullable();
            $table->string('reference_paiement')->nullable();

            $table->text('notes')->nullable();
            $table->softDeletes();
            $table->timestamps();

            // L'écran « Achats » ouvre sur la file d'attente de validation, et les états
            // financiers agrègent par période : ces deux accès méritent leur index.
            $table->index(['entreprise_id', 'statut']);
            $table->index('date_facture');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('factures_fournisseur');
    }
};
