<?php

namespace App\Http\Responses;

use App\Support\RoleDashboard;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    /**
     * Un client atterrit sur le portail public, tout autre rôle sur SON tableau de bord
     * réel (Phase 07) — voir RoleDashboard, la même source que la route `dashboard`
     * générique (clic sur le logo), pour ne jamais faire diverger les deux.
     */
    public function toResponse($request): RedirectResponse
    {
        $role = Auth::user()?->role;

        $intended = $role === 'client' ? '/' : RoleDashboard::route($role);

        return redirect()->intended($intended);
    }
}
