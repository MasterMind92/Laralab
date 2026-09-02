<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Fournisseurs de biens (Phase 10). Table DISTINCTE de `partenaires`, qui n'a
     * délibérément pas d'`entreprise_id` : c'est un catalogue global géré par
     * l'Administrateur (décision actée Phase 09) et destiné aux prestations rendues aux
     * clients via `demandes_service`. Un fournisseur, lui, appartient à une entreprise —
     * les fusionner obligerait soit à rendre les fournisseurs globaux, soit à casser le
     * catalogue de l'Administrateur.
     */
    public function up(): void
    {
        Schema::create('fournisseurs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entreprise_id')->nullable()->constrained()->nullOnDelete();
            $table->string('nom');
            $table->string('contact')->nullable();
            $table->string('email')->nullable();
            $table->string('telephone')->nullable();
            $table->string('adresse')->nullable();
            $table->boolean('actif')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->index(['entreprise_id', 'actif']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fournisseurs');
    }
};
