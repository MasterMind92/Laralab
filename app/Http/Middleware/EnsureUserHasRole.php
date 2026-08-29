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

        // Les routes exigeant explicitement 'administrateur' (provisioning des
        // entreprises/utilisateurs, voir routes/web.php) touchent des modeles
        // (Entreprise, User) volontairement SANS scope multi-tenant — le bypass
        // proprietaire/gerant, prevu pour les poles operationnels ou les global
        // scopes des modeles filtrent quand meme les donnees, laisserait sinon un
        // proprietaire agir sur n'importe quelle AUTRE entreprise sans aucun filtre
        // (faille corrigee le 2026-08-29, decouverte via security-review).
        $routeExigeAdministrateurSeul = in_array('administrateur', $roles, true);

        if ($userRole !== null && in_array($userRole, self::ENTREPRISE_FULL_ACCESS_ROLES, true) && ! $routeExigeAdministrateurSeul) {
            return $next($request);
        }

        if ($userRole !== null && in_array($userRole, $roles, true)) {
            return $next($request);
        }

        abort(403);
    }
}
