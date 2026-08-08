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
        Schema::table('parametres_facturation', function (Blueprint $table) {
            $table->boolean('tva_active')->default(false)->after('taux_frais_service');
            $table->decimal('taux_tva', 5, 4)->default(0.18)->after('tva_active');
            $table->decimal('depot_garantie_defaut', 10, 2)->default(0)->after('taux_tva');
            $table->unsignedInteger('delai_restitution_jours')->default(7)->after('depot_garantie_defaut');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('parametres_facturation', function (Blueprint $table) {
            $table->dropColumn(['tva_active', 'taux_tva', 'depot_garantie_defaut', 'delai_restitution_jours']);
        });
    }
};
