<?php

namespace App\Http\Responses;

use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\Contracts\VerifyEmailResponse as VerifyEmailResponseContract;

class VerifyEmailResponse implements VerifyEmailResponseContract
{
    /**
     * Un client atterrit sur le portail public, tout autre rôle sur le back-office interne.
     */
    public function toResponse($request): RedirectResponse
    {
        $intended = Auth::user()?->role === 'client' ? '/' : config('fortify.home');

        return redirect()->intended($intended.'?verified=1');
    }
}
