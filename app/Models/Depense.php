<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['libelle', 'montant', 'date_depense', 'categorie', 'valideur_id'])]
class Depense extends Model
{
    protected function casts(): array
    {
        return [
            'montant' => 'decimal:2',
            'date_depense' => 'date',
        ];
    }

    public function valideur(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'valideur_id');
    }
}
