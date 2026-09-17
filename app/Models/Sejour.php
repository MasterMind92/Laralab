<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\ScopedThroughEntreprise;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['reservation_id', 'date_entree', 'date_sortie', 'etat_lieux_entree', 'etat_lieux_sortie', 'statut'])]
class Sejour extends Model
{
    use Auditable;
    use ScopedThroughEntreprise;
    use SoftDeletes;

    public static function entrepriseRelationPath(): string
    {
        return 'reservation.appartement';
    }

    protected function casts(): array
    {
        return [
            'date_entree' => 'date',
            'date_sortie' => 'date',
        ];
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }

    public function factures(): HasMany
    {
        return $this->hasMany(Facture::class);
    }

    /**
     * La facture la plus récente (au plus une facture active à la fois en pratique,
     * même si le schéma autorise un historique — cf. plan Phase 03).
     */
    public function facture(): HasOne
    {
        return $this->hasOne(Facture::class)->latestOfMany();
    }

    public function demandes(): HasMany
    {
        return $this->hasMany(DemandeService::class);
    }

    public function dommages(): HasMany
    {
        return $this->hasMany(Dommage::class);
    }
}
