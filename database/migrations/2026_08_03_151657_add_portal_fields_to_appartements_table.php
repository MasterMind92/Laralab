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
        Schema::table('appartements', function (Blueprint $table) {
            $table->string('titre')->nullable()->after('numero');
            $table->text('description')->nullable()->after('titre');
            $table->string('adresse')->nullable()->after('description');
            $table->enum('type', ['studio', 't2', 't3', 't4_plus', 'penthouse', 'villa'])->nullable()->after('adresse');
            $table->json('photos')->nullable()->after('type');
            $table->unsignedInteger('chambres')->nullable()->after('capacite');
            $table->unsignedInteger('salles_de_bain')->nullable()->after('chambres');
            $table->decimal('surface_m2', 8, 2)->nullable()->after('salles_de_bain');
            // Auto-géré par Appartement::booted() quand statut_entretien quitte/retrouve 'propre'.
            $table->timestamp('indisponible_depuis')->nullable()->after('statut_entretien');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appartements', function (Blueprint $table) {
            $table->dropColumn([
                'titre',
                'description',
                'adresse',
                'type',
                'photos',
                'chambres',
                'salles_de_bain',
                'surface_m2',
                'indisponible_depuis',
            ]);
        });
    }
};
