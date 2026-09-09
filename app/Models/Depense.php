<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEntreprise;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Le journal des charges (Phase 06). La table existait depuis la Phase 00 sans jamais
 * servir ; elle porte enfin son cloisonnement par entreprise et une origine.
 *
 * **Une dépense est une CHARGE de l'exercice, jamais une immobilisation.** C'est la
 * distinction actée le 2026-09-09 : la ligne de partage n'est pas « matériel ou
 * immatériel » mais « consommé dans l'exercice ou durable ». Un carton de produits
 * d'entretien est une charge ; un climatiseur à 250 000 FCFA est un actif qui servira
 * plusieurs années, et l'inscrire ici ferait mentir le résultat du mois.
 *
 * Deux origines possibles, d'où le caractère nullable du lien :
 *   - le règlement d'une facture fournisseur (voir FactureFournisseur::genererDepenses) ;
 *   - une saisie directe, pour ce qui n'a jamais eu de facture — petite caisse, note de
 *     frais.
 */
#[Fillable([
    'entreprise_id', 'libelle', 'montant', 'date_depense', 'categorie',
    'valideur_id', 'facture_fournisseur_ligne_id',
])]
class Depense extends Model
{
    use BelongsToEntreprise;
    use SoftDeletes;

    /** Mêmes familles que FactureFournisseurLigne — une seule nomenclature dans le projet. */
    public const CATEGORIES = FactureFournisseurLigne::CATEGORIES;

    protected $attributes = [
        'categorie' => 'autres',
    ];

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

    public function ligneFactureFournisseur(): BelongsTo
    {
        return $this->belongsTo(FactureFournisseurLigne::class, 'facture_fournisseur_ligne_id');
    }

    /** Saisie à la main, sans facture fournisseur derrière. */
    public function estSaisieDirecte(): bool
    {
        return $this->facture_fournisseur_ligne_id === null;
    }

    public function scopeSurPeriode(Builder $query, ?string $du, ?string $au): Builder
    {
        return $query
            ->when($du, fn ($q, $d) => $q->whereDate('date_depense', '>=', $d))
            ->when($au, fn ($q, $a) => $q->whereDate('date_depense', '<=', $a));
    }
}
