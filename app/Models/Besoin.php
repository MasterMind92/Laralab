<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\BelongsToEntreprise;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Expression de besoin (Phase 10) — premier maillon de la chaîne
 * `Besoin → Commande → Réception → Enregistrement → Affectation`.
 *
 * `valide_par_id` et `date_validation` sont ABSENTS de Fillable : ils ne doivent jamais
 * être écrits par un tableau validé venu d'une requête, seulement par `valider()` depuis
 * du code serveur. Même précaution que `Intervention::$sous_garantie`.
 */
#[Fillable([
    'entreprise_id', 'demandeur_employe_id', 'appartement_id',
    'designation', 'quantite', 'justification', 'priorite', 'statut', 'motif_refus',
])]
class Besoin extends Model
{
    use Auditable;
    use BelongsToEntreprise;
    use SoftDeletes;

    /** Source de vérité unique du cycle du besoin. */
    public const STATUTS = ['brouillon', 'soumis', 'valide', 'refuse', 'commande'];

    /**
     * `refuse` renvoie vers `brouillon` et non vers une impasse : un besoin refusé pour
     * une justification insuffisante doit pouvoir être corrigé et resoumis, sinon le
     * demandeur en ressaisit un second et l'historique du premier se perd.
     *
     * `commande` est terminal ici : la suite de la vie du besoin se lit sur la commande.
     */
    public const TRANSITIONS = [
        'brouillon' => ['soumis'],
        'soumis' => ['valide', 'refuse'],
        'valide' => ['commande'],
        'refuse' => ['brouillon'],
        'commande' => [],
    ];

    /**
     * Les defaults SQL ne remontent pas dans l'instance renvoyee par `create()` : sans
     * cela, `$besoin->statut` vaut null juste apres la creation et `peutPasserA()`
     * refuse la premiere transition. Ces valeurs doublent celles de la migration a
     * dessein — l'objet en memoire doit dire la meme chose que la table.
     */
    protected $attributes = [
        'statut' => 'brouillon',
        'quantite' => 1,
        'priorite' => 'normale',
    ];

    protected function casts(): array
    {
        return [
            'date_validation' => 'date',
        ];
    }

    public function demandeur(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'demandeur_employe_id');
    }

    public function valideur(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'valide_par_id');
    }

    public function appartement(): BelongsTo
    {
        return $this->belongsTo(Appartement::class);
    }

    public function commandeLignes(): HasMany
    {
        return $this->hasMany(CommandeLigne::class);
    }

    public function peutPasserA(string $statut): bool
    {
        return in_array($statut, self::TRANSITIONS[$this->statut] ?? [], true);
    }

    /** Les besoins validés que le logisticien peut encore porter sur une commande. */
    public function scopeACommander(Builder $query): Builder
    {
        return $query->where('statut', 'valide');
    }

    public function scopeEnAttenteDeValidation(Builder $query): Builder
    {
        return $query->where('statut', 'soumis');
    }
}
