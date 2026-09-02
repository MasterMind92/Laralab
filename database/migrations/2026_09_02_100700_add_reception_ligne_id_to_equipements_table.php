<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * La soudure entre la Phase 10 (approvisionnement) et la Phase 05 (parc) : d'où vient
     * cette pièce ?
     *
     * Vers `reception_lignes` et non `commande_lignes` : une ligne de commande dit ce qui
     * a été demandé, une ligne de réception dit ce qui est arrivé, et c'est de la seconde
     * que naît physiquement l'équipement. La commande reste atteignable par un saut de
     * plus, sans jamais rendre les deux chemins contradictoires.
     *
     * Nullable et `nullOnDelete` : tout le parc existant est antérieur à cette chaîne, et
     * un équipement enregistré à la main restera toujours légitime.
     */
    public function up(): void
    {
        Schema::table('equipements', function (Blueprint $table) {
            $table->foreignId('reception_ligne_id')
                ->nullable()
                ->after('appartement_id')
                ->constrained('reception_lignes')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('equipements', function (Blueprint $table) {
            $table->dropConstrainedForeignId('reception_ligne_id');
        });
    }
};
