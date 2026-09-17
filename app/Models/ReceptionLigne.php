<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
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
    use Auditable;
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
     * Un écart, c'est une non-conformité déclarée, ou un SURPLUS par rapport à ce qui
     * restait dû au moment de cette livraison.
     *
     * Corrigé le 2026-09-03 : la première version comparait la quantité de CETTE livraison
     * au total commandé, ce qui faisait d'une livraison partielle un écart — or c'est le
     * cas le plus courant, et la commande reste simplement ouverte. Sur le jeu de
     * démonstration, 4 lignes sur 6 étaient signalées à tort ; branchée sur la
     * notification `EcartReception`, la règle aurait fait sonner la cloche à chaque
     * livraison, jusqu'à ce que plus personne ne la regarde.
     *
     * Le surplus, lui, reste un vrai écart : un fournisseur qui livre plus que commandé
     * crée du travail (surfacturation, retour, stock non budgété).
     */
    public function presenteUnEcart(): bool
    {
        if (! $this->conforme) {
            return true;
        }

        if ($this->commandeLigne === null) {
            return false;
        }

        // Ce qui restait dû AVANT cette livraison : les autres réceptions de la même
        // ligne de commande, celle-ci exclue — sinon on se compare à soi-même.
        $dejaRecu = (int) $this->commandeLigne->receptionLignes()
            ->when($this->exists, fn ($q) => $q->whereKeyNot($this->getKey()))
            ->sum('quantite_recue');

        return $this->quantite_recue > max(0, $this->commandeLigne->quantite - $dejaRecu);
    }

    /** La file de l'écran « Enregistrement ». */
    public function scopeAEnregistrer(Builder $query): Builder
    {
        return $query->whereColumn('quantite_enregistree', '<', 'quantite_recue');
    }
}
