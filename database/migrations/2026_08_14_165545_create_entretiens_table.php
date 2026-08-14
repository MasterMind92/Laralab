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
        Schema::create('entretiens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidat_id')->constrained('candidats')->restrictOnDelete();
            $table->unsignedInteger('numero_tour')->default(1);
            $table->dateTime('date_entretien');
            $table->enum('type', ['visio', 'presentiel', 'telephone']);
            $table->unsignedInteger('duree_minutes')->nullable();
            $table->enum('statut', ['planifie', 'realise', 'annule'])->default('planifie');
            $table->enum('decision', ['favorable', 'defavorable', 'en_attente'])->nullable();
            $table->text('note')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('entretiens');
    }
};
