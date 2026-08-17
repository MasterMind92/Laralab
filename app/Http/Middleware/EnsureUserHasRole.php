<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Administrateur (vendeur) : bypass tous les pôles, toutes entreprises.
     */
    private const GLOBAL_BYPASS_ROLES = ['administrateur'];

    /**
     * Proprietaire/Gerant : bypass tous les pôles comme administrateur, mais les
     * DONNEES restent filtrees par entreprise via les global scopes des modeles
     * (BelongsToEntreprise/ScopedThroughEntreprise, Phase 09) — ce middleware ne
     * decide plus que l'acces a la route/au pole, jamais le filtrage ligne par ligne.
     */
    private const ENTREPRISE_FULL_ACCESS_ROLES = ['proprietaire', 'gerant'];

    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $userRole = $request->user()?->role;

        if ($userRole !== null && in_array($userRole, self::GLOBAL_BYPASS_ROLES, true)) {
            return $next($request);
        }

        if ($userRole !== null && (in_array($userRole, self::ENTREPRISE_FULL_ACCESS_ROLES, true) || in_array($userRole, $roles, true))) {
            return $next($request);
        }

        abort(403);
    }
}
