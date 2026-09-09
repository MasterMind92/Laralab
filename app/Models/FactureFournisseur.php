<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEntreprise;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Facture fournisseur (Phase 06) — l'écran « Achats ».
 *
 * `statut`, `valide_par_id`, `date_validation` et `date_paiement` sont ABSENTS de Fillable :
 * ce sont des traces de décisions, écrites uniquement par les méthodes ci-dessous. Même
 * précaution que `Commande::$statut` et `Intervention::$sous_garantie` — laisser le statut
 * remplissable rouvrirait la porte à une facture déclarée payée sans qu'aucun règlement
 * n'ait eu lieu, et la dépense correspondante ne serait jamais écrite.
 */
#[Fillable([
    'entreprise_id', 'fournisseur_id', 'commande_id', 'reference',
    'date_facture', 'date_echeance', 'motif_rejet', 'notes',
])]
class FactureFournisseur extends Model
{
    use BelongsToEntreprise;
    use SoftDeletes;

    protected $table = 'factures_fournisseur';

    public const STATUTS = ['a_valider', 'validee', 'payee', 'annulee'];

    public const STATUTS_TERMINAUX = ['payee', 'annulee'];

    /**
     * Une facture rejetée n'existe pas : on l'annule, ou on la renvoie en validation après
     * correction. `validee → a_valider` couvre le cas très réel d'une facture validée trop
     * vite, tant qu'elle n'est pas payée — après paiement, plus rien ne bouge.
     */
    public const TRANSITIONS = [
        'a_valider' => ['validee', 'annulee'],
        'validee' => ['payee', 'a_valider', 'annulee'],
        'payee' => [],
        'annulee' => [],
    ];

    /** Voir Besoin::$attributes : l'instance rendue par create() doit déjà porter son statut. */
    protected $attributes = [
        'statut' => 'a_valider',
    ];

    protected function casts(): array
    {
        return [
            'date_facture' => 'date',
            'date_echeance' => 'date',
            'date_validation' => 'date',
            'date_paiement' => 'date',
        ];
    }

    public function fournisseur(): BelongsTo
    {
        return $this->belongsTo(Fournisseur::class);
    }

    public function commande(): BelongsTo
    {
        return $this->belongsTo(Commande::class);
    }

    public function valideur(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'valide_par_id');
    }

    public function lignes(): HasMany
    {
        return $this->hasMany(FactureFournisseurLigne::class);
    }

    /** Les charges déjà écrites au journal par cette facture, à travers ses lignes. */
    public function depenses(): HasManyThrough
    {
        return $this->hasManyThrough(
            Depense::class,
            FactureFournisseurLigne::class,
            'facture_fournisseur_id',
            'facture_fournisseur_ligne_id',
        );
    }

    public function peutPasserA(string $statut): bool
    {
        return in_array($statut, self::TRANSITIONS[$this->statut] ?? [], true);
    }

    /** Somme des lignes, calculée et jamais stockée — voir Commande::montantTotal(). */
    public function montantTotal(): float
    {
        return (float) $this->lignes->sum(fn (FactureFournisseurLigne $l) => $l->montant());
    }

    /** Ce qui pèsera sur le résultat de l'exercice. */
    public function montantCharges(): float
    {
        return (float) $this->lignes
            ->where('nature', 'charge')
            ->sum(fn (FactureFournisseurLigne $l) => $l->montant());
    }

    /** Ce qui entre à l'actif et ne pèse donc PAS sur le résultat du mois. */
    public function montantImmobilise(): float
    {
        return (float) $this->lignes
            ->where('nature', 'immobilisation')
            ->sum(fn (FactureFournisseurLigne $l) => $l->montant());
    }

    public function estEnRetard(): bool
    {
        return $this->statut === 'validee'
            && $this->date_echeance !== null
            && $this->date_echeance->isPast();
    }

    /**
     * Écrit au journal des charges ce que ce règlement vient de coûter — et rien d'autre.
     *
     * Deux règles portées ici plutôt que dans un contrôleur, parce qu'elles définissent ce
     * qu'EST une dépense dans ce projet :
     *
     * 1. **Seules les lignes de nature `charge` produisent une dépense.** Une
     *    immobilisation est un actif : la porter au résultat du mois où elle est payée
     *    ferait mentir le compte de résultat. Elle reste traçable par la ligne de facture
     *    et, quand elle vient de la chaîne logistique, par l'équipement lui-même.
     * 2. **C'est le PAIEMENT qui déclenche l'écriture**, pas la validation. C'est la
     *    frontière actée le 2026-08-24 avec la Logistique : celle-ci s'arrête à la commande
     *    et à la réception physique, la dépense s'écrit ici quand la facture est réglée.
     *
     * Idempotente : une ligne déjà passée en dépense n'en produit pas une seconde. Un
     * double clic ou une relecture du statut ne doit pas doubler les charges du mois.
     *
     * @return int nombre de dépenses effectivement créées
     */
    public function genererDepenses(): int
    {
        $creees = 0;

        foreach ($this->lignes()->where('nature', 'charge')->get() as $ligne) {
            if (Depense::where('facture_fournisseur_ligne_id', $ligne->id)->exists()) {
                continue;
            }

            Depense::create([
                'entreprise_id' => $this->entreprise_id,
                'libelle' => $ligne->designation,
                'montant' => $ligne->montant(),
                // La date de la dépense est celle du RÈGLEMENT, pas celle de la facture :
                // c'est ce jour-là que l'argent est sorti.
                'date_depense' => ($this->date_paiement ?? now())->toDateString(),
                'categorie' => $ligne->categorie ?? 'autres',
                'valideur_id' => $this->valide_par_id,
                'facture_fournisseur_ligne_id' => $ligne->id,
            ]);

            $creees++;
        }

        return $creees;
    }

    /**
     * Les trois écritures de statut, seules autorisées à toucher `statut` — la colonne
     * étant absente de Fillable, aucun tableau validé venu d'une requête ne peut les
     * court-circuiter.
     */
    public function valider(?int $employeId): void
    {
        $this->forceFill([
            'statut' => 'validee',
            'valide_par_id' => $employeId,
            'date_validation' => now()->toDateString(),
            'motif_rejet' => null,
        ])->save();
    }

    /**
     * Règle la facture ET écrit les charges au journal, dans cet ordre : `genererDepenses()`
     * date la dépense d'après `date_paiement`, qui doit donc déjà être posée.
     */
    public function payer(string $datePaiement, ?string $mode = null, ?string $reference = null): int
    {
        $this->forceFill([
            'statut' => 'payee',
            'date_paiement' => $datePaiement,
            'mode_paiement' => $mode,
            'reference_paiement' => $reference,
        ])->save();

        return $this->genererDepenses();
    }

    public function annuler(?string $motif = null): void
    {
        $this->forceFill(['statut' => 'annulee', 'motif_rejet' => $motif])->save();
    }

    /** Retour en file d'attente : une facture validée trop vite, pas encore réglée. */
    public function renvoyerEnValidation(?string $motif = null): void
    {
        $this->forceFill([
            'statut' => 'a_valider',
            'motif_rejet' => $motif,
            'valide_par_id' => null,
            'date_validation' => null,
        ])->save();
    }

    public function scopeAValider(Builder $query): Builder
    {
        return $query->where('statut', 'a_valider');
    }

    /** Validées mais pas encore réglées — le passif fournisseur du moment. */
    public function scopeADue(Builder $query): Builder
    {
        return $query->where('statut', 'validee');
    }

    public function scopeOuvertes(Builder $query): Builder
    {
        return $query->whereNotIn('statut', self::STATUTS_TERMINAUX);
    }
}
