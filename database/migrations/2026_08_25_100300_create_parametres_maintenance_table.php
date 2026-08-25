<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Calque parametres_facturation (Phase 09) : une ligne par entreprise dès le
     * départ, jamais de singleton global (voir ParametreMaintenance::actuel()).
     * jours_ouvres stocke des jours ISO (1=lundi ... 7=dimanche) pour éviter toute
     * dépendance à une locale/chaîne de nom de jour (voir app/Support/HeuresOuvrees.php).
     * Pas de valeur par défaut portable pour une colonne JSON : le défaut de
     * jours_ouvres est posé dans ParametreMaintenance::actuel() au premier appel.
     */
    public function up(): void
    {
        Schema::create('parametres_maintenance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entreprise_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->unsignedInteger('sla_critique_heures')->default(1);
            $table->unsignedInteger('sla_haute_heures')->default(2);
            $table->unsignedInteger('sla_normale_heures')->default(8);
            $table->unsignedInteger('sla_basse_heures')->default(24);
            $table->time('heure_ouverture')->default('08:00:00');
            $table->time('heure_fermeture')->default('18:00:00');
            $table->json('jours_ouvres')->nullable();
            $table->decimal('seuil_reforme', 10, 2)->default(150000);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parametres_maintenance');
    }
};
