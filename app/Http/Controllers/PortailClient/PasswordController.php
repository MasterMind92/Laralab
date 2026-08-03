<?php

namespace App\Http\Controllers\PortailClient;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class PasswordController extends Controller
{
    /**
     * Affiche la page portail "mot de passe oublié". Poste vers POST /forgot-password
     * (Fortify, inchangé) — aucune logique d'envoi dupliquée ici.
     */
    public function forgot(Request $request): Response
    {
        return Inertia::render('portail-client/ForgotPasswordPage', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Affiche la page portail de réinitialisation. Poste vers POST /reset-password
     * (Fortify, inchangé). Le lien qui mène ici est généré par
     * FortifyServiceProvider::configurePasswordResetUrls() pour les clients.
     */
    public function reset(Request $request, string $token): Response
    {
        return Inertia::render('portail-client/ResetPasswordPage', [
            'email' => $request->query('email'),
            'token' => $token,
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
        ]);
    }
}
