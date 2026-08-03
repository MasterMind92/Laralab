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
        Schema::create('parametres_facturation', function (Blueprint $table) {
            $table->id();
            $table->boolean('frais_service_actif')->default(false);
            $table->decimal('taux_frais_service', 5, 4)->default(0.12);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('parametres_facturation');
    }
};
