<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['user_id', 'nom', 'prenom', 'poste', 'date_embauche', 'salaire_base', 'actif'])]
class Employe extends Model
{
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'date_embauche' => 'date',
            'salaire_base' => 'decimal:2',
            'actif' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function contratsTravail(): HasMany
    {
        return $this->hasMany(ContratTravail::class);
    }

    public function conges(): HasMany
    {
        return $this->hasMany(Conge::class);
    }

    public function equipements(): HasMany
    {
        return $this->hasMany(Equipement::class);
    }

    public function interventions(): HasMany
    {
        return $this->hasMany(Intervention::class);
    }

    public function depensesValidees(): HasMany
    {
        return $this->hasMany(Depense::class, 'valideur_id');
    }

    public function onboardingTaches(): HasMany
    {
        return $this->hasMany(OnboardingTache::class);
    }

    public function licenciements(): HasMany
    {
        return $this->hasMany(Licenciement::class);
    }

    /**
     * Le contrat en vigueur (sans date_fin, ou date_fin future), le plus récent.
     * Source de vérité pour le salaire affiché (règle 5) — salaire_base n'est plus édité.
     */
    public function contratActif(): ?ContratTravail
    {
        return $this->contratsTravail()
            ->where(fn ($q) => $q->whereNull('date_fin')->orWhereDate('date_fin', '>=', now()))
            ->orderByDesc('date_debut')
            ->first();
    }
}
