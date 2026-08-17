<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Null pour administrateur/client. Renseigne pour proprietaire/gerant/staff
     * (Phase 09, multi-tenant). Un Gerant = une seule Entreprise (decision actee).
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('entreprise_id')->nullable()->after('role')->constrained()->nullOnDelete();
            $table->boolean('actif')->default(true)->after('entreprise_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('entreprise_id');
            $table->dropColumn('actif');
        });
    }
};
