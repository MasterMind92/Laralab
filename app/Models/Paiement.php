<?php

namespace App\Models;

use App\Models\Concerns\ScopedThroughEntreprise;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['facture_id', 'montant', 'mode_paiement', 'reference_transaction', 'date_paiement'])]
class Paiement extends Model
{
    use ScopedThroughEntreprise;

    public static function entrepriseRelationPath(): string
    {
        return 'facture.sejour.reservation.appartement';
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
}
