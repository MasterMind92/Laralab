<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * responsable_id/valide_par_id sont tous deux nullable sur recrutements : un
     * recrutement peut exister sans aucun lien Employe et ne peut donc pas heriter
     * le scope entreprise de facon fiable (voir plan Phase 09) — colonne directe.
     */
    public function up(): void
    {
        Schema::table('recrutements', function (Blueprint $table) {
            $table->foreignId('entreprise_id')->nullable()->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('recrutements', function (Blueprint $table) {
            $table->dropConstrainedForeignId('entreprise_id');
        });
    }
};
