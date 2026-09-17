<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Journal d'audit (Phase 08, extension) — qui a fait quoi, quand, sur quoi. Alimenté
     * uniquement par le trait Auditable (app/Models/Concerns/Auditable.php), jamais écrit
     * à la main depuis un contrôleur. Journal en AJOUT SEUL : pas d'updated_at, une ligne
     * n'est jamais modifiée après coup.
     */
    public function up(): void
    {
        Schema::create('journal_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entreprise_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->morphs('auditable');
            $table->enum('action', ['creation', 'modification', 'suppression', 'restauration']);
            $table->json('donnees')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['entreprise_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('journal_audits');
    }
};
