<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\ScopedThroughEntreprise;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['facture_id', 'type', 'designation', 'quantite', 'prix_unitaire', 'montant'])]
class FactureLigne extends Model
{
    use Auditable;
    use ScopedThroughEntreprise;

    protected $table = 'facture_lignes';

    public static function entrepriseRelationPath(): string
    {
        return 'facture.sejour.reservation.appartement';
    }

    protected function casts(): array
    {
        return [
            'prix_unitaire' => 'decimal:2',
            'montant' => 'decimal:2',
        ];
    }

    public function facture(): BelongsTo
    {
        return $this->belongsTo(Facture::class);
    }
}
