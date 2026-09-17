<?php

use App\Http\Middleware\EnsureUserHasRole;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    // Premier ordonnanceur du projet (Phase 12). Il n'existe que parce qu'un depassement
    // de SLA n'est pas un evenement applicatif : aucune action utilisateur ne le produit,
    // c'est le temps qui passe. En local il faut lancer `php artisan schedule:work` a
    // cote de `serve` ; en production, un cron sur `schedule:run` toutes les minutes.
    //
    // withoutOverlapping : un balayage qui traine ne doit pas etre double par le suivant,
    // sous peine de notifier deux fois la meme intervention avant que sla_notifie_le soit
    // ecrit.
    ->withSchedule(function (Schedule $schedule): void {
        $schedule->command('maintenance:alerter-sla')
            ->everyFifteenMinutes()
            ->withoutOverlapping();
    })
    ->withMiddleware(function (Middleware $middleware): void {
        // L'hebergement n'est pas encore choisi, donc l'IP du futur reverse-proxy est
        // inconnue : faire confiance a tous les proxies immediats est le reglage standard
        // Laravel dans ce cas (sans ca, en prod derriere n'importe quel nginx/load-balancer,
        // Laravel ne voit jamais le HTTPS reel : URLs generees en http://, cookies "secure"
        // jamais envoyes). A resserrer a une IP precise une fois l'hebergement tranche.
        $middleware->trustProxies(at: '*');

        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'role' => EnsureUserHasRole::class,
        ]);

        // Un visiteur non connecté sur une page côté client (portail) doit atterrir sur la
        // connexion du portail, pas sur celle du back-office interne (et inversement).
        $middleware->redirectGuestsTo(function (Request $request) {
            return $request->is('checkout*', 'mes-reservations*', 'mon-compte*')
                ? '/connexion'
                : '/login';
        });
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
