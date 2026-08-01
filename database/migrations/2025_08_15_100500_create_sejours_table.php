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
        Schema::create('sejours', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reservation_id')->unique()->constrained()->restrictOnDelete();
            $table->date('date_entree');
            $table->date('date_sortie')->nullable();
            $table->text('etat_lieux_entree')->nullable();
            $table->text('etat_lieux_sortie')->nullable();
            $table->text('casses')->nullable();
            $table->enum('statut', ['en_cours', 'cloture'])->default('en_cours');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sejours');
    }
};
