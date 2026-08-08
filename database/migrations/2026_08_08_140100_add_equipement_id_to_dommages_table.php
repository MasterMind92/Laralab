<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Lien optionnel vers l'équipement concerné (même principe que Intervention) —
     * nullable car le catalogue ne couvre que les aménités, pas tout le mobilier
     * (un dommage sur un objet non catalogué reste possible, description libre).
     */
    public function up(): void
    {
        Schema::table('dommages', function (Blueprint $table) {
            $table->foreignId('equipement_id')->nullable()->after('sejour_id')
                ->constrained('equipements')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dommages', function (Blueprint $table) {
            $table->dropForeign(['equipement_id']);
            $table->dropColumn('equipement_id');
        });
    }
};
