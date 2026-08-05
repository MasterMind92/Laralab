<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use App\Http\Responses\LoginResponse;
use App\Http\Responses\VerifyEmailResponse;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Laravel\Fortify\Contracts\VerifyEmailResponse as VerifyEmailResponseContract;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureActions();
        $this->configureViews();
        $this->configureRateLimiting();
        $this->configurePasswordResetUrls();
        $this->configurePasswordResetMail();
        $this->configureEmailVerification();
    }

    /**
     * Configure Fortify actions.
     */
    private function configureActions(): void
    {
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::createUsersUsing(CreateNewUser::class);

        $this->app->singleton(LoginResponseContract::class, LoginResponse::class);
        $this->app->singleton(VerifyEmailResponseContract::class, VerifyEmailResponse::class);
    }

    /**
     * L'appli n'a pas de app/Providers/EventServiceProvider.php, donc le mapping
     * Registered -> SendEmailVerificationNotification que Laravel câble d'habitude
     * automatiquement n'est jamais enregistré : on le déclare ici explicitement.
     * Habillage LuxStay minimal du mail (thème complet réutilisé/étendu à l'Étape 6).
     */
    private function configureEmailVerification(): void
    {
        Event::listen(Registered::class, SendEmailVerificationNotification::class);

        VerifyEmail::toMailUsing(function ($notifiable, string $url) {
            return (new MailMessage)
                ->subject('Confirmez votre adresse e-mail — LuxStay')
                ->greeting('Bonjour '.$notifiable->name.',')
                ->line('Merci de vous être inscrit sur LuxStay. Confirmez votre adresse e-mail pour activer pleinement votre compte.')
                ->action('Confirmer mon adresse e-mail', $url)
                ->line("Si vous n'êtes pas à l'origine de cette inscription, vous pouvez ignorer cet e-mail.")
                ->theme('luxstay');
        });
    }

    /**
     * Le lien de réinitialisation envoyé par e-mail pointe vers une page portail
     * pour un client, vers la page interne pour tout autre rôle — sans dupliquer
     * le POST /reset-password de Fortify, réutilisé tel quel des deux côtés.
     */
    private function configurePasswordResetUrls(): void
    {
        ResetPassword::createUrlUsing(function ($notifiable, string $token) {
            if ($notifiable->role === 'client') {
                return url('/connexion/reinitialiser-mot-de-passe/'.$token).'?email='.urlencode($notifiable->email);
            }

            return url(route('password.reset', ['token' => $token, 'email' => $notifiable->email], false));
        });
    }

    /**
     * Habillage LuxStay minimal du mail de réinitialisation (même thème que la
     * vérification d'e-mail). Réutilise le callback de configurePasswordResetUrls()
     * pour ne pas dupliquer la logique de construction du lien selon le rôle.
     */
    private function configurePasswordResetMail(): void
    {
        ResetPassword::toMailUsing(function ($notifiable, string $token) {
            $url = call_user_func(ResetPassword::$createUrlCallback, $notifiable, $token);
            $expire = config('auth.passwords.'.config('auth.defaults.passwords').'.expire');

            return (new MailMessage)
                ->subject('Réinitialisation de votre mot de passe — LuxStay')
                ->greeting('Bonjour '.$notifiable->name.',')
                ->line('Vous recevez cet e-mail car nous avons reçu une demande de réinitialisation de mot de passe pour votre compte.')
                ->action('Réinitialiser mon mot de passe', $url)
                ->line("Ce lien de réinitialisation expirera dans {$expire} minutes.")
                ->line("Si vous n'êtes pas à l'origine de cette demande, aucune action n'est requise.")
                ->theme('luxstay');
        });
    }

    /**
     * Configure Fortify views.
     */
    private function configureViews(): void
    {
        Fortify::loginView(fn (Request $request) => Inertia::render('auth/login', [
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'status' => $request->session()->get('status'),
        ]));

        Fortify::resetPasswordView(fn (Request $request) => Inertia::render('auth/reset-password', [
            'email' => $request->email,
            'token' => $request->route('token'),
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
        ]));

        Fortify::requestPasswordResetLinkView(fn (Request $request) => Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::verifyEmailView(fn (Request $request) => Inertia::render(
            $request->user()?->role === 'client' ? 'portail-client/EmailVerificationNoticePage' : 'auth/verify-email',
            ['status' => $request->session()->get('status')],
        ));

        Fortify::registerView(fn () => Inertia::render('auth/register', [
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
        ]));

        Fortify::twoFactorChallengeView(fn () => Inertia::render('auth/two-factor-challenge'));

        Fortify::confirmPasswordView(fn () => Inertia::render('auth/confirm-password'));
    }

    /**
     * Configure rate limiting.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->session()->get('login.id'));
        });

        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });

        RateLimiter::for('passkeys', function (Request $request) {
            return Limit::perMinute(10)->by(
                ($request->input('credential.id') ?: $request->session()->getId()).'|'.$request->ip(),
            );
        });
    }
}
