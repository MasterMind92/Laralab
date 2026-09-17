<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\ScopedThroughEntreprise;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Ligne d'une commande fournisseur (Phase 10). `designation` et `prix_unitaire` sont
 * recopiés du besoin d'origine plutôt que lus à travers la relation : une commande
 * envoyée est un engagement, elle ne change pas de contenu parce que le libellé du besoin
 * a été corrigé après coup.
 */
#[Fillable(['commande_id', 'besoin_id', 'designation', 'quantite', 'prix_unitaire'])]
class CommandeLigne extends Model
{
    use Auditable;
    use ScopedThroughEntreprise;

    public static function entrepriseRelationPath(): string
    {
        return 'commande';
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

    public function commande(): BelongsTo
    {
        return $this->belongsTo(Commande::class);
    }

    public function besoin(): BelongsTo
    {
        return $this->belongsTo(Besoin::class);
    }

    public function receptionLignes(): HasMany
    {
        return $this->hasMany(ReceptionLigne::class);
    }

    public function montant(): float
    {
        return $this->quantite * (float) $this->prix_unitaire;
    }

    /** Cumul de toutes les livraisons portant sur cette ligne, partielles comprises. */
    public function quantiteRecue(): int
    {
        return (int) $this->receptionLignes()->sum('quantite_recue');
    }

    public function quantiteRestante(): int
    {
        return max(0, $this->quantite - $this->quantiteRecue());
    }
}
