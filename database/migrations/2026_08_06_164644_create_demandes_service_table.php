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
        Schema::create('demandes_service', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sejour_id')->constrained('sejours')->cascadeOnDelete();
            $table->string('designation');
            $table->unsignedInteger('quantite')->default(1);
            $table->decimal('prix_unitaire', 10, 2)->default(0);
            $table->enum('statut', ['demandee', 'livree'])->default('demandee');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('demandes_service');
    }
};
