<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Première utilisation du soft delete dans le projet (convention actée le
     * 2026-08-06) — appliquée ici aux tables du pôle Réceptionniste puisqu'on les
     * touche déjà pour le Round 2. Les autres entités seront migrées séparément.
     */
    public function up(): void
    {
        Schema::table('reservations', fn (Blueprint $table) => $table->softDeletes());
        Schema::table('sejours', fn (Blueprint $table) => $table->softDeletes());
        Schema::table('interventions', fn (Blueprint $table) => $table->softDeletes());
        Schema::table('demandes_service', fn (Blueprint $table) => $table->softDeletes());
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reservations', fn (Blueprint $table) => $table->dropSoftDeletes());
        Schema::table('sejours', fn (Blueprint $table) => $table->dropSoftDeletes());
        Schema::table('interventions', fn (Blueprint $table) => $table->dropSoftDeletes());
        Schema::table('demandes_service', fn (Blueprint $table) => $table->dropSoftDeletes());
    }
};
