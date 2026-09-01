<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Table `notifications` standard de Laravel (Phase 12) : on ajoute le canal
     * `database` à côté du canal `mail` déjà utilisé par les notifications client
     * (Phase 02/03), on ne construit pas un système parallèle. Le trait Notifiable est
     * déjà sur User.
     *
     * Une ligne PAR DESTINATAIRE, donc `read_at` est individuel : qu'un technicien lise
     * une alerte ne doit pas la marquer lue pour ses collègues. La diffusion « à tout un
     * rôle » se fait par un éventail côté PHP (voir App\Support\Destinataires), pas par
     * une ligne partagée avec une table de lecture — c'est le fonctionnement natif du
     * framework, et le volume d'utilisateurs internes ne justifie pas d'en dévier.
     */
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            // Le compteur de non-lues est chargé sur CHAQUE page (props partagées
            // Inertia) : cet index est ce qui empêche ce confort de coûter cher.
            $table->index(['notifiable_type', 'notifiable_id', 'read_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
