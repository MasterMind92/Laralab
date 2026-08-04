<?php

namespace App\Http\Controllers\PortailClient;

use App\Concerns\PasswordValidationRules;
use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class RegisterController extends Controller
{
    use PasswordValidationRules;

    /**
     * Inscription d'un client portail : crée User (role: client) + Client liés en
     * transaction, distinct du /register interne (auth/register.tsx) qui ne collecte
     * ni prénom/nom séparés ni téléphone.
     */
    public function store(Request $request): RedirectResponse
    {
        Validator::make($request->all(), [
            'prenom' => ['required', 'string', 'max:255'],
            'nom' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'telephone' => ['nullable', 'string', 'max:20'],
            'password' => $this->passwordRules(),
        ])->validate();

        $user = DB::transaction(function () use ($request) {
            $user = User::create([
                'name' => trim($request->input('prenom').' '.$request->input('nom')),
                'email' => $request->input('email'),
                'password' => $request->input('password'),
                'role' => 'client',
            ]);

            Client::create([
                'user_id' => $user->id,
                'nom' => $request->input('nom'),
                'prenom' => $request->input('prenom'),
                'telephone' => $request->input('telephone'),
                'email' => $request->input('email'),
            ]);

            return $user;
        });

        event(new Registered($user));

        Auth::login($user);

        return redirect('/');
    }
}
