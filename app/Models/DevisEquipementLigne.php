<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\ScopedThroughEntreprise;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Une ligne de devis équipement (extension Phase 06), une par `ReceptionLigne`
 * enregistrée — voir la migration pour le détail de l'upsert idempotent.
 */
#[Fillable(['devis_equipement_id', 'reception_ligne_id', 'designation', 'quantite', 'prix_unitaire'])]
class DevisEquipementLigne extends Model
{
    use Auditable;
    use ScopedThroughEntreprise;

    public static function entrepriseRelationPath(): string
    {
        return 'devisEquipement';
    }

    protected $attributes = [
        'quantite' => 1,
        'prix_unitaire' => 0,
    ];

    protected function casts(): array
    {
        return [
            'prix_unitaire' => 'decimal:2',
        ];
    }

    public function devisEquipement(): BelongsTo
    {
        return $this->belongsTo(DevisEquipement::class);
    }

    public function receptionLigne(): BelongsTo
    {
        return $this->belongsTo(ReceptionLigne::class);
    }

    public function montant(): float
    {
        return $this->quantite * (float) $this->prix_unitaire;
    }
}
