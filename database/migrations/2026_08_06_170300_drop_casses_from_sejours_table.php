<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Remplacé par la relation Sejour::dommages() (une ligne par dommage, chiffrable
     * pour la Phase 03) — voir create_dommages_table.
     */
    public function up(): void
    {
        Schema::table('sejours', function (Blueprint $table) {
            $table->dropColumn('casses');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sejours', function (Blueprint $table) {
            $table->text('casses')->nullable();
        });
    }
};
