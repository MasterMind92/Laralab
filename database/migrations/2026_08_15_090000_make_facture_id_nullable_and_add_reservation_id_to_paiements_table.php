<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
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
     *
     * `->change()` ne nécessite PAS doctrine/dbal dans cette version de Laravel (vérifié
     * sur MySQL et SQLite, 2026-09-17) — portable sur les deux pilotes, y compris sur une
     * colonne qui porte déjà une contrainte de clé étrangère (testé).
     */
    public function up(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->foreignId('facture_id')->nullable()->change();
            $table->enum('mode_paiement', ['cb', 'especes', 'virement', 'mobile_money', 'paypal'])->change();
        });

        Schema::table('paiements', function (Blueprint $table) {
            $table->foreignId('reservation_id')->nullable()->after('facture_id')->constrained('reservations')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->dropConstrainedForeignId('reservation_id');
        });

        Schema::table('paiements', function (Blueprint $table) {
            $table->enum('mode_paiement', ['cb', 'especes', 'virement', 'mobile_money'])->change();
            $table->foreignId('facture_id')->nullable(false)->change();
        });
    }
};
