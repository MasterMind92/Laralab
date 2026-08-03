<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\CarbonInterface;

#[Fillable([
    'numero', 'capacite', 'prix_nuit', 'statut_entretien',
    'titre', 'description', 'adresse', 'type', 'photos',
    'chambres', 'salles_de_bain', 'surface_m2',
])]
class Appartement extends Model
{
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
     * Photos réelles si présentes, sinon la liste de repli configurée.
     */
    public function photosAffichables(): array
    {
        return ! empty($this->photos) ? $this->photos : config('portail.photos_defaut', []);
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

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function equipements(): HasMany
    {
        return $this->hasMany(Equipement::class);
    }

    public function interventions(): HasMany
    {
        return $this->hasMany(Intervention::class);
    }
}
