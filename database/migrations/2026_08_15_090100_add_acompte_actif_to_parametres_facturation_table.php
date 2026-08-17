<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('parametres_facturation', function (Blueprint $table) {
            $table->boolean('acompte_actif')->default(false)->after('delai_restitution_jours');
        });
    }

    public function down(): void
    {
        Schema::table('parametres_facturation', function (Blueprint $table) {
            $table->dropColumn('acompte_actif');
        });
    }
};
