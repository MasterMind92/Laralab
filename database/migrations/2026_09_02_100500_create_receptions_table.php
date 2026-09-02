<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Réception physique d'une commande (Phase 10).
     *
     * Une commande peut en avoir PLUSIEURS : c'est ce qui rend la livraison partielle
     * représentable sans écraser la précédente. Chaque réception est un événement daté qui
     * s'ajoute aux autres, jamais une correction de la dernière — d'où l'absence de statut
     * ici : c'est la commande qui en dérive le sien.
     */
    public function up(): void
    {
        Schema::create('receptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('commande_id')->constrained()->cascadeOnDelete();
            $table->foreignId('receptionnaire_employe_id')->nullable()->constrained('employes')->nullOnDelete();
            $table->date('date_reception');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('receptions');
    }
};
