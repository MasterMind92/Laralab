<?php

namespace App\Models\Concerns;

use App\Models\Entreprise;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Pour les agregats racines tenant-scopes (Appartement, Employe, Recrutement,
 * ParametreFacturation) : filtre automatiquement sur l'entreprise de l'utilisateur
 * connecte. Pas de filtre pour administrateur (acces global) ni client (jamais
 * tenant-scope — reserve sur des appartements de n'importe quelle entreprise via
 * le portail public, voir User::TENANT_EXEMPT_ROLES). Un utilisateur scope sans
 * entreprise_id (compte orphelin) ne voit que les autres lignes elles-memes
 * orphelines — fail-open, decision actee (Phase 09).
 */
trait BelongsToEntreprise
{
    protected static function bootBelongsToEntreprise(): void
    {
        static::addGlobalScope('entreprise', function (Builder $builder) {
            $user = auth()->user();

            if (! $user || in_array($user->role, User::TENANT_EXEMPT_ROLES, true)) {
                return;
            }

            $builder->where($builder->getModel()->getTable().'.entreprise_id', $user->entreprise_id);
        });

        static::creating(function ($model) {
            if (! $model->entreprise_id && auth()->user()?->entreprise_id) {
                $model->entreprise_id = auth()->user()->entreprise_id;
            }
        });
    }

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class);
    }
}
