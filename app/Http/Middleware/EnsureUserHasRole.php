<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Rôles ayant accès à tous les pôles, quel que soit le rôle demandé par la route.
     */
    private const FULL_ACCESS_ROLES = ['proprietaire', 'gerant'];

    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $userRole = $request->user()?->role;

        if ($userRole !== null && (in_array($userRole, self::FULL_ACCESS_ROLES, true) || in_array($userRole, $roles, true))) {
            return $next($request);
        }

        abort(403);
    }
}
