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
        Schema::create('depenses', function (Blueprint $table) {
            $table->id();
            $table->string('libelle');
            $table->decimal('montant', 10, 2);
            $table->date('date_depense');
            $table->enum('categorie', ['achats', 'salaires', 'maintenance', 'fournitures']);
            $table->foreignId('valideur_id')->nullable()->constrained('employes')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('depenses');
    }
};
