<?php

namespace App\Models\Concerns;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * Pour les tables qui atteignent un agregat racine BelongsToEntreprise via une
 * chaine de relations BelongsTo (ex. Entretien -> Candidat -> Recrutement). Chaque
 * modele declare uniquement le chemin de relation menant a la racine ; whereHas()
 * reapplique automatiquement les global scopes du modele lie a chaque saut, donc
 * aucune comparaison entreprise_id n'est jamais dupliquee ici (Phase 09).
 */
trait ScopedThroughEntreprise
{
    protected static function bootScopedThroughEntreprise(): void
    {
        static::addGlobalScope('entreprise', function (Builder $builder) {
            $user = auth()->user();

            if (! $user || in_array($user->role, User::TENANT_EXEMPT_ROLES, true)) {
                return;
            }

            $builder->whereHas(static::entrepriseRelationPath());
        });
    }

    abstract public static function entrepriseRelationPath(): string;
}
