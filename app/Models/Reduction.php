<?php

namespace App\Models;

use App\Models\Concerns\ScopedThroughEntreprise;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['appartement_id', 'nuits_min', 'type', 'valeur'])]
class Reduction extends Model
{
    use ScopedThroughEntreprise;

    public static function entrepriseRelationPath(): string
    {
        return 'appartement';
    }

    protected function casts(): array
    {
        return [
            'valeur' => 'decimal:2',
        ];
    }

    public function appartement(): BelongsTo
    {
        return $this->belongsTo(Appartement::class);
    }

    /**
     * Montant de la réduction pour un sous-total donné, jamais négatif ni
     * supérieur au sous-total lui-même (cas du montant_fixe sur un court séjour).
     */
    public function montantPour(float $sousTotal): float
    {
        return $this->type === 'pourcentage'
            ? round($sousTotal * (float) $this->valeur / 100)
            : min((float) $this->valeur, $sousTotal);
    }
}
