<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['reservation_id', 'date_entree', 'date_sortie', 'etat_lieux_entree', 'etat_lieux_sortie', 'statut'])]
class Sejour extends Model
{
    use SoftDeletes;

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

    public function demandes(): HasMany
    {
        return $this->hasMany(DemandeService::class);
    }

    public function dommages(): HasMany
    {
        return $this->hasMany(Dommage::class);
    }
}
