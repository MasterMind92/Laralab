<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['sejour_id', 'designation', 'quantite', 'prix_unitaire', 'statut'])]
class DemandeService extends Model
{
    protected $table = 'demandes_service';

    protected function casts(): array
    {
        return [
            'prix_unitaire' => 'decimal:2',
        ];
    }

    public function sejour(): BelongsTo
    {
        return $this->belongsTo(Sejour::class);
    }

    public function montant(): float
    {
        return $this->quantite * (float) $this->prix_unitaire;
    }
}
