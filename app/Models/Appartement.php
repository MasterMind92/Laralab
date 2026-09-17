<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\BelongsToEntreprise;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

#[Fillable([
    'numero', 'capacite', 'prix_nuit', 'statut_entretien',
    'titre', 'description', 'adresse', 'type', 'photos',
    'chambres', 'salles_de_bain', 'surface_m2', 'entreprise_id',
])]
class Appartement extends Model
{
    use Auditable;
    use BelongsToEntreprise;
    use HasFactory;

    /**
     * Gère automatiquement `indisponible_depuis` quand `statut_entretien` change
     * (jamais à la création, seulement lors d'une vraie transition de statut).
     */
    protected static function booted(): void
    {
        static::saving(function (Appartement $appartement) {
            if (! $appartement->exists || ! $appartement->isDirty('statut_entretien')) {
                return;
            }

            $appartement->indisponible_depuis = $appartement->statut_entretien === 'propre'
                ? null
                : now();
        });
    }

    protected function casts(): array
    {
        return [
            'prix_nuit' => 'decimal:2',
            'surface_m2' => 'decimal:2',
            'photos' => 'array',
            'indisponible_depuis' => 'datetime',
        ];
    }

    /**
     * Photos réelles (URL recalculée à partir du chemin relatif stocké, jamais figée)
     * si présentes, sinon la liste de repli configurée.
     */
    public function photosAffichables(): array
    {
        if (empty($this->photos)) {
            return config('portail.photos_defaut', []);
        }

        return collect($this->photos)
            ->map(fn (string $path) => Storage::disk('public')->url($path))
            ->all();
    }

    /**
     * Estimation indicative de retour à disponibilité (n'ouvre jamais la réservation
     * automatiquement — seul le repassage manuel de statut_entretien à 'propre' le fait).
     */
    public function disponibleLe(): ?CarbonInterface
    {
        if (! $this->indisponible_depuis) {
            return null;
        }

        return $this->indisponible_depuis->copy()
            ->addHours(config('portail.duree_indisponibilite_defaut_heures', 24));
    }

    /**
     * Forme plate utilisée par les pages du portail public (Inertia props).
     * Nécessite la relation `reductions` déjà chargée (voir PortailClient\AppartementController).
     */
    public function pourPortail(): array
    {
        return [
            'id' => $this->id,
            'numero' => $this->numero,
            'titre' => $this->titre,
            'description' => $this->description,
            'adresse' => $this->adresse,
            'type' => $this->type,
            'prix_nuit' => $this->prix_nuit,
            'capacite' => $this->capacite,
            'chambres' => $this->chambres,
            'salles_de_bain' => $this->salles_de_bain,
            'surface_m2' => $this->surface_m2,
            'photos' => $this->photosAffichables(),
            'statut_entretien' => $this->statut_entretien,
            'disponible_le' => $this->disponibleLe()?->toIso8601String(),
            'reductions' => $this->reductions
                ->sortBy('nuits_min')
                ->values()
                ->map(fn (Reduction $r) => [
                    'id' => $r->id,
                    'nuits_min' => $r->nuits_min,
                    'type' => $r->type,
                    'valeur' => $r->valeur,
                ])
                ->all(),
        ];
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function equipements(): HasMany
    {
        return $this->hasMany(Equipement::class);
    }

    public function reductions(): HasMany
    {
        return $this->hasMany(Reduction::class);
    }

    /**
     * Palier de réduction applicable pour un séjour de $nights nuits : celui au plus
     * grand nuits_min <= $nights (escalier progressif, pas de plage à borne max).
     * Nécessite la relation `reductions` déjà chargée.
     */
    public function reductionApplicable(int $nights): ?Reduction
    {
        return $this->reductions
            ->filter(fn (Reduction $r) => $r->nuits_min <= $nights)
            ->sortByDesc('nuits_min')
            ->first();
    }

    /**
     * Base, réduction applicable et sous-total pour un séjour de $nights nuits.
     * Les frais de service (dépendent de ParametreFacturation, pas de l'appartement)
     * restent à calculer par l'appelant, sur ce sous-total.
     *
     * @return array{base: float, reduction: ?Reduction, discount: float, sous_total: float}
     */
    public function prixPour(int $nights): array
    {
        $base = $nights * (float) $this->prix_nuit;
        $reduction = $nights > 0 ? $this->reductionApplicable($nights) : null;
        $discount = $reduction ? $reduction->montantPour($base) : 0;

        return ['base' => $base, 'reduction' => $reduction, 'discount' => $discount, 'sous_total' => $base - $discount];
    }

    public function interventions(): HasMany
    {
        return $this->hasMany(Intervention::class);
    }
}
