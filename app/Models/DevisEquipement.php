<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEntreprise;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Devis équipement (extension Phase 06) — ce que la plateforme facture au Propriétaire
 * pour l'équipement durable acheté pour son compte, généré automatiquement à
 * l'Enregistrement (voir `LogistiqueController::enregistrer()`).
 *
 * `statut`, `valide_par_id` et les dates ne sont pas dans Fillable : mêmes précautions que
 * `FactureFournisseur`, dont ce modèle reprend le cycle presque à l'identique.
 */
#[Fillable(['entreprise_id', 'reception_id', 'notes'])]
class DevisEquipement extends Model
{
    use BelongsToEntreprise;
    use SoftDeletes;

    public const STATUTS = ['brouillon', 'validee', 'payee', 'annulee'];

    public const STATUTS_TERMINAUX = ['payee', 'annulee'];

    public const TRANSITIONS = [
        'brouillon' => ['validee', 'annulee'],
        'validee' => ['payee', 'brouillon', 'annulee'],
        'payee' => [],
        'annulee' => [],
    ];

    protected $attributes = [
        'statut' => 'brouillon',
    ];

    protected function casts(): array
    {
        return [
            'majoration_active' => 'boolean',
            'taux_majoration' => 'decimal:4',
            'date_validation' => 'date',
            'date_paiement' => 'date',
        ];
    }

    public function reception(): BelongsTo
    {
        return $this->belongsTo(Reception::class);
    }

    public function valideur(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'valide_par_id');
    }

    public function lignes(): HasMany
    {
        return $this->hasMany(DevisEquipementLigne::class);
    }

    public function peutPasserA(string $statut): bool
    {
        return in_array($statut, self::TRANSITIONS[$this->statut] ?? [], true);
    }

    /** Somme des lignes avant toute majoration. */
    public function montantBase(): float
    {
        return (float) $this->lignes->sum(fn (DevisEquipementLigne $l) => $l->montant());
    }

    /** Ce qui sera réellement facturé au Propriétaire. */
    public function montant(): float
    {
        $base = $this->montantBase();

        if (! $this->majoration_active || $this->taux_majoration === null) {
            return $base;
        }

        return $base * (1 + (float) $this->taux_majoration);
    }

    /**
     * Autorisée seulement en brouillon : passé ce stade, le montant a été communiqué au
     * Propriétaire, il ne doit plus bouger sous lui.
     */
    public function definirMajoration(bool $active, ?float $taux): void
    {
        $this->forceFill([
            'majoration_active' => $active,
            'taux_majoration' => $active ? $taux : null,
        ])->save();
    }

    public function valider(?int $employeId): void
    {
        $this->forceFill([
            'statut' => 'validee',
            'valide_par_id' => $employeId,
            'date_validation' => now()->toDateString(),
            'motif_rejet' => null,
        ])->save();
    }

    public function payer(string $datePaiement, ?string $mode = null, ?string $reference = null): void
    {
        $this->forceFill([
            'statut' => 'payee',
            'date_paiement' => $datePaiement,
            'mode_paiement' => $mode,
            'reference_paiement' => $reference,
        ])->save();
    }

    public function annuler(?string $motif = null): void
    {
        $this->forceFill(['statut' => 'annulee', 'motif_rejet' => $motif])->save();
    }

    public function renvoyerEnValidation(?string $motif = null): void
    {
        $this->forceFill([
            'statut' => 'brouillon',
            'motif_rejet' => $motif,
            'valide_par_id' => null,
            'date_validation' => null,
        ])->save();
    }

    public function scopeOuvertes(Builder $query): Builder
    {
        return $query->whereNotIn('statut', self::STATUTS_TERMINAUX);
    }
}
