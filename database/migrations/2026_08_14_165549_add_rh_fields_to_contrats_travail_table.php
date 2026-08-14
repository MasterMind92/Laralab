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
        Schema::table('contrats_travail', function (Blueprint $table) {
            $table->decimal('salaire', 10, 2)->nullable()->after('type_contrat');
            $table->foreignId('candidat_id')->nullable()->after('fichier_contrat')->constrained('candidats')->nullOnDelete();
            $table->foreignId('embauche_par_id')->nullable()->after('candidat_id')->constrained('employes')->nullOnDelete();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contrats_travail', function (Blueprint $table) {
            $table->dropConstrainedForeignId('candidat_id');
            $table->dropConstrainedForeignId('embauche_par_id');
            $table->dropColumn('salaire');
            $table->dropSoftDeletes();
        });
    }
};
