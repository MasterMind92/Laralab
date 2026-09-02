<?php

namespace App\Models;

use App\Models\Concerns\ScopedThroughEntreprise;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Ce qui a réellement été reçu, ligne de commande par ligne de commande (Phase 10).
 *
 * `quantite_enregistree` est ABSENT de Fillable : ce compteur n'est incrémenté que par
 * l'écran d'Enregistrement, au moment où des `Equipement` sont réellement créés. Le
 * rendre remplissable permettrait de déclarer une livraison enregistrée sans qu'aucune
 * pièce n'entre au parc.
 */
#[Fillable([
    'reception_id', 'commande_ligne_id', 'quantite_recue', 'conforme', 'motif_ecart',
])]
class ReceptionLigne extends Model
{
    use ScopedThroughEntreprise;

    public static function entrepriseRelationPath(): string
    {
        return 'reception.commande';
    }

    protected $attributes = [
        'quantite_recue' => 0,
        'quantite_enregistree' => 0,
        'conforme' => true,
    ];

    protected function casts(): array
    {
        return [
            'conforme' => 'boolean',
        ];
    }

    public function reception(): BelongsTo
    {
        return $this->belongsTo(Reception::class);
    }

    public function commandeLigne(): BelongsTo
    {
        return $this->belongsTo(CommandeLigne::class);
    }

    public function equipements(): HasMany
    {
        return $this->hasMany(Equipement::class);
    }

    /** Ce qui a été livré mais n'est pas encore entré au parc. */
    public function resteAEnregistrer(): int
    {
        return max(0, $this->quantite_recue - $this->quantite_enregistree);
    }

    /**
     * Un écart, c'est soit une non-conformité déclarée, soit une quantité livrée qui ne
     * correspond pas à ce qui avait été commandé — dans un sens comme dans l'autre : un
     * fournisseur qui livre trop crée autant de travail qu'un fournisseur qui livre peu.
     */
    public function presenteUnEcart(): bool
    {
        if (! $this->conforme) {
            return true;
        }

        return $this->commandeLigne !== null
            && $this->quantite_recue !== $this->commandeLigne->quantite;
    }

    /** La file de l'écran « Enregistrement ». */
    public function scopeAEnregistrer(Builder $query): Builder
    {
        return $query->whereColumn('quantite_enregistree', '<', 'quantite_recue');
    }
}
