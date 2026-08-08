<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['sejour_id', 'numero_facture', 'montant_ht', 'montant_ttc', 'statut', 'date_edition', 'date_echeance'])]
class Facture extends Model
{
    protected function casts(): array
    {
        return [
            'montant_ht' => 'decimal:2',
            'montant_ttc' => 'decimal:2',
            'date_edition' => 'date',
            'date_echeance' => 'date',
        ];
    }

    public function sejour(): BelongsTo
    {
        return $this->belongsTo(Sejour::class);
    }

    public function paiements(): HasMany
    {
        return $this->hasMany(Paiement::class);
    }

    public function lignes(): HasMany
    {
        return $this->hasMany(FactureLigne::class);
    }
}
