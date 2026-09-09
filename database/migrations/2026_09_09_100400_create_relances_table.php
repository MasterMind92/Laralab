<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Historique des relances sur une facture client impayée (Phase 06) — l'écran
     * « Recouvrements factures ».
     *
     * Une entité plutôt qu'un simple bouton « relancer » : sans trace, on relance trois
     * fois le même client la même semaine sans le savoir, et on ne sait pas répondre à la
     * seule question qui compte devant un impayé ancien — « qu'a-t-on déjà tenté ? ».
     *
     * Le canal est enregistré parce qu'un appel et un e-mail n'ont pas le même poids dans
     * une discussion de recouvrement, et parce que seul l'e-mail est automatisable.
     */
    public function up(): void
    {
        Schema::create('relances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('facture_id')->constrained('factures')->cascadeOnDelete();
            $table->foreignId('employe_id')->nullable()->constrained('employes')->nullOnDelete();

            $table->date('date_relance');
            $table->enum('canal', ['email', 'telephone', 'courrier', 'sur_place'])->default('email');

            // Ce que le client a répondu, ou ce qui a été convenu. Le champ le plus utile
            // de la table en pratique : « rappelle lundi », « conteste la ligne dommages ».
            $table->text('note')->nullable();

            // Montant encore dû AU MOMENT de la relance : la facture peut être soldée plus
            // tard, l'historique doit continuer à dire pourquoi on avait relancé.
            $table->decimal('solde_restant', 12, 2)->default(0);

            $table->timestamps();

            $table->index(['facture_id', 'date_relance']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('relances');
    }
};
