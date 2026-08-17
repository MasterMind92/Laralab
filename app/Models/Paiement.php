<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['facture_id', 'reservation_id', 'montant', 'mode_paiement', 'reference_transaction', 'date_paiement'])]
class Paiement extends Model
{
    /**
     * Atteint son entreprise par deux chemins distincts selon son origine : via la
     * Facture (encaissement Comptabilité classique) ou directement via la Reservation
     * (avance perçue au portail client, avant même qu'une Facture existe — voir
     * PortailClient\ReservationController::store()). ScopedThroughEntreprise ne gère
     * qu'un seul chemin fixe, d'où ce scope dédié plutôt que le trait générique.
     */
    protected static function booted(): void
    {
        static::addGlobalScope('entreprise', function (Builder $builder) {
            $user = auth()->user();

            if (! $user || in_array($user->role, User::TENANT_EXEMPT_ROLES, true)) {
                return;
            }

            $builder->where(fn (Builder $q) => $q->whereHas('facture.sejour.reservation.appartement')
                ->orWhereHas('reservation.appartement'));
        });
    }

    protected function casts(): array
    {
        return [
            'montant' => 'decimal:2',
            'date_paiement' => 'datetime',
        ];
    }

    public function facture(): BelongsTo
    {
        return $this->belongsTo(Facture::class);
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }
}
