<?php

namespace App\Models;

use App\Models\Concerns\ScopedThroughEntreprise;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Le détail d'une facture fournisseur (Phase 06) — et le seul endroit du projet où se
 * décide la nature comptable d'un achat.
 *
 * `designation` et `prix_unitaire` sont recopiés depuis la ligne de commande quand elle
 * existe, jamais lus à travers la relation : une facture reçue est un document du
 * fournisseur, elle ne change pas de contenu parce qu'on a corrigé le libellé du bon de
 * commande après coup. Même raisonnement que `CommandeLigne`.
 */
#[Fillable([
    'facture_fournisseur_id', 'commande_ligne_id',
    'designation', 'quantite', 'prix_unitaire', 'nature', 'categorie',
])]
class FactureFournisseurLigne extends Model
{
    use ScopedThroughEntreprise;

    public const NATURES = ['charge', 'immobilisation'];

    /**
     * Familles de charges, calquées sur les regroupements de la classe 6 du plan OHADA
     * sans prétendre reproduire un plan comptable complet — le projet a besoin d'un
     * compte de résultat lisible, pas d'une liasse fiscale.
     *
     * Ne s'appliquent qu'aux lignes de nature `charge` : une immobilisation n'est pas une
     * charge, elle n'a donc pas de famille de charge.
     */
    public const CATEGORIES = [
        'achats_consommables',
        'services_exterieurs',
        'personnel',
        'impots_taxes',
        'charges_financieres',
        'autres',
    ];

    public static function entrepriseRelationPath(): string
    {
        return 'factureFournisseur';
    }

    protected $attributes = [
        'quantite' => 1,
        'prix_unitaire' => 0,
        'nature' => 'charge',
    ];

    protected function casts(): array
    {
        return [
            'prix_unitaire' => 'decimal:2',
        ];
    }

    public function factureFournisseur(): BelongsTo
    {
        return $this->belongsTo(FactureFournisseur::class);
    }

    public function commandeLigne(): BelongsTo
    {
        return $this->belongsTo(CommandeLigne::class);
    }

    /** La charge écrite au journal quand la facture a été réglée, s'il y en a une. */
    public function depense(): HasOne
    {
        return $this->hasOne(Depense::class);
    }

    public function montant(): float
    {
        return $this->quantite * (float) $this->prix_unitaire;
    }

    public function estCharge(): bool
    {
        return $this->nature === 'charge';
    }

    public function scopeCharges(Builder $query): Builder
    {
        return $query->where('nature', 'charge');
    }

    public function scopeImmobilisations(Builder $query): Builder
    {
        return $query->where('nature', 'immobilisation');
    }
}
