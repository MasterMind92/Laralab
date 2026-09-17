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
 * Commande fournisseur (Phase 10).
 *
 * `statut` est ABSENT de Fillable, et c'est le cœur de la règle d'or du cadrage du
 * 2026-08-24 : **une commande ne modifie jamais le stock, c'est la réception qui fait
 * avancer la commande**. Les deux statuts de réception se calculent depuis les quantités
 * réellement reçues (`recalculerStatut()`), les deux autres transitions sont explicites
 * (`envoyer()`, `confirmer()`, `annuler()`). Laisser `statut` remplissable rouvrirait la
 * porte à une commande déclarée « reçue » sans que rien n'ait été livré.
 */
#[Fillable([
    'entreprise_id', 'fournisseur_id', 'reference',
    'date_commande', 'date_livraison_prevue', 'notes',
])]
class Commande extends Model
{
    use Auditable;
    use BelongsToEntreprise;
    use SoftDeletes;

    public const STATUTS = ['brouillon', 'envoyee', 'confirmee', 'partiellement_recue', 'recue', 'annulee'];

    /** Calculés depuis les réceptions, jamais choisis dans un formulaire. */
    public const STATUTS_DERIVES = ['partiellement_recue', 'recue'];

    public const STATUTS_TERMINAUX = ['recue', 'annulee'];

    /**
     * Transitions MANUELLES uniquement. `partiellement_recue` et `recue` n'y figurent pas
     * en cible : on n'y entre que par `recalculerStatut()`.
     *
     * On peut encore annuler une commande partiellement reçue — un fournisseur qui ne
     * livrera jamais le solde est un cas courant, et laisser la commande éternellement
     * « partiellement reçue » ferait mentir la file de travail.
     */
    public const TRANSITIONS = [
        'brouillon' => ['envoyee', 'annulee'],
        'envoyee' => ['confirmee', 'annulee'],
        'confirmee' => ['annulee'],
        'partiellement_recue' => ['annulee'],
        'recue' => [],
        'annulee' => [],
    ];

    /** Voir Besoin::$attributes : l'instance creee doit deja porter son statut. */
    protected $attributes = [
        'statut' => 'brouillon',
    ];

    protected function casts(): array
    {
        return [
            'date_commande' => 'date',
            'date_livraison_prevue' => 'date',
        ];
    }

    public function fournisseur(): BelongsTo
    {
        return $this->belongsTo(Fournisseur::class);
    }

    public function lignes(): HasMany
    {
        return $this->hasMany(CommandeLigne::class);
    }

    public function receptions(): HasMany
    {
        return $this->hasMany(Reception::class);
    }

    public function peutPasserA(string $statut): bool
    {
        return in_array($statut, self::TRANSITIONS[$this->statut] ?? [], true);
    }

    /** Une commande n'accepte de réception qu'une fois partie chez le fournisseur. */
    public function accepteReception(): bool
    {
        return in_array($this->statut, ['envoyee', 'confirmee', 'partiellement_recue'], true);
    }

    /**
     * Somme des lignes. Calculée et non stockée : une colonne `montant_total` serait une
     * seconde vérité à tenir à jour à chaque modification de ligne.
     */
    public function montantTotal(): float
    {
        return (float) $this->lignes->sum(fn (CommandeLigne $ligne) => $ligne->montant());
    }

    /**
     * Fait dériver le statut des quantités réellement reçues.
     *
     * Vérification LIGNE PAR LIGNE et non sur le total : un fournisseur qui livre le
     * double d'un article et rien d'un autre ne solde pas la commande, alors qu'une
     * comparaison de sommes globales conclurait qu'elle est complète.
     *
     * Une commande annulée n'est jamais réveillée par une réception tardive : c'est une
     * décision humaine, elle prime sur le calcul.
     */
    public function recalculerStatut(): void
    {
        if ($this->statut === 'annulee') {
            return;
        }

        // Relations relues et non `loadMissing` : cette méthode est appelée juste après
        // l'écriture d'une réception, et une relation déjà chargée avant l'insertion
        // rendrait un total périmé — donc un statut faux.
        $lignes = $this->lignes()->get();

        $recuTotal = 0;
        $toutesCompletes = $lignes->isNotEmpty();

        foreach ($lignes as $ligne) {
            $recu = $ligne->quantiteRecue();
            $recuTotal += $recu;

            if ($recu < $ligne->quantite) {
                $toutesCompletes = false;
            }
        }

        // Aucune livraison : le statut reste celui du cycle manuel (brouillon/envoyée/
        // confirmée), il n'y a rien à dériver.
        if ($recuTotal === 0) {
            return;
        }

        $nouveau = $toutesCompletes ? 'recue' : 'partiellement_recue';

        if ($this->statut !== $nouveau) {
            $this->forceFill(['statut' => $nouveau])->save();
        }
    }

    public function scopeOuvertes(Builder $query): Builder
    {
        return $query->whereNotIn('statut', self::STATUTS_TERMINAUX);
    }

    /**
     * La référence est DÉRIVÉE DE L'IDENTIFIANT, une fois la ligne écrite — au format
     * CMD-0001.
     *
     * La calculer avant l'insertion (`max('id') + 1`) serait une course : deux commandes
     * créées dans la même seconde obtiendraient le même numéro et la seconde violerait
     * l'unicité. Partir de l'identifiant réel supprime le problème plutôt que d'en réduire
     * la probabilité.
     *
     * Le numéro suit la table entière et non l'entreprise : une référence de bon de
     * commande sert d'identifiant vis-à-vis d'un tiers, et deux entreprises partageant un
     * même numéro rendraient tout échange ambigu.
     *
     * `saveQuietly()` pour ne pas relancer les événements depuis un événement.
     */
    protected static function booted(): void
    {
        static::created(function (self $commande) {
            if ($commande->reference === null) {
                $commande->forceFill(['reference' => sprintf('CMD-%04d', $commande->id)])->saveQuietly();
            }
        });
    }
}
