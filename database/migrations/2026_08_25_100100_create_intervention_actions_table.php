<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Journal d'actions par intervention (R4) : diagnostic, réparation, pose de pièce,
     * contrôle, note libre. piece_libelle/piece_quantite sont volontairement de simples
     * champs texte/nombre, pas une FK vers un stock — la Phase 10 (Logistique) n'existe
     * pas encore ; le pont se fera plus tard sans casser ce qui existe ici.
     */
    public function up(): void
    {
        Schema::create('intervention_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('intervention_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['diagnostic', 'reparation', 'piece', 'controle', 'note']);
            $table->text('description')->nullable();
            $table->unsignedInteger('temps_passe_minutes')->nullable();
            $table->string('piece_libelle')->nullable();
            $table->unsignedInteger('piece_quantite')->nullable();
            $table->decimal('cout', 10, 2)->default(0);
            $table->dateTime('effectuee_le');
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('intervention_actions');
    }
};
