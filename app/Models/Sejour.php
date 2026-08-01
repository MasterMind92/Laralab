<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['reservation_id', 'date_entree', 'date_sortie', 'etat_lieux_entree', 'etat_lieux_sortie', 'casses', 'statut'])]
class Sejour extends Model
{
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
}
