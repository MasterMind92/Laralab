<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Permet à un Paiement de naître avant qu'une Facture existe : un acompte/paiement
     * intégral simulé à la réservation (portail client) est d'abord rattaché à la
     * Reservation, puis "réclamé" par la Facture une fois celle-ci générée à la clôture
     * du séjour (facture_id mis à jour sur la même ligne, jamais dupliquée). Invariant
     * maintenu côté application (pas en contrainte SQL) : à la création, exactement un
     * des deux FK est renseigné.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE paiements MODIFY facture_id BIGINT UNSIGNED NULL');
        DB::statement("ALTER TABLE paiements MODIFY mode_paiement ENUM('cb','especes','virement','mobile_money','paypal') NOT NULL");

        Schema::table('paiements', function (Blueprint $table) {
            $table->foreignId('reservation_id')->nullable()->after('facture_id')->constrained('reservations')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->dropConstrainedForeignId('reservation_id');
        });

        DB::statement("ALTER TABLE paiements MODIFY mode_paiement ENUM('cb','especes','virement','mobile_money') NOT NULL");
        DB::statement('ALTER TABLE paiements MODIFY facture_id BIGINT UNSIGNED NOT NULL');
    }
};
