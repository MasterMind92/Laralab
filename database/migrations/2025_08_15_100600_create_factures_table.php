<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('factures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sejour_id')->constrained()->restrictOnDelete();
            $table->string('numero_facture')->unique();
            $table->decimal('montant_ht', 10, 2);
            $table->decimal('montant_ttc', 10, 2);
            $table->enum('statut', ['brouillon', 'validee', 'payee', 'annulee'])->default('brouillon');
            $table->date('date_edition');
            $table->date('date_echeance')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('factures');
    }
};
