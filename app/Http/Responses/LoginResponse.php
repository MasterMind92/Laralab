<?php

namespace App\Http\Responses;

use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    /**
     * Un client atterrit sur le portail public, tout autre rôle sur le back-office interne.
     */
    public function toResponse($request): RedirectResponse
    {
        $intended = Auth::user()?->role === 'client' ? '/' : config('fortify.home');

        return redirect()->intended($intended);
    }
}
