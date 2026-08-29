<?php

namespace App\Http\Responses;

use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    /**
     * Un client atterrit sur le portail public, un administrateur sur sa vue plateforme
     * dédiée (voir Admin\DashboardController — sinon il tombait sur /admin/dashboard,
     * le mock générique partagé par les autres pôles, via le bypass de EnsureUserHasRole),
     * tout autre rôle sur le back-office interne générique.
     */
    public function toResponse($request): RedirectResponse
    {
        $role = Auth::user()?->role;

        $intended = match (true) {
            $role === 'client' => '/',
            $role === 'administrateur' => route('admin.dashboard'),
            default => config('fortify.home'),
        };

        return redirect()->intended($intended);
    }
}
