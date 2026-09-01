<?php

namespace App\Http\Middleware;

use App\Support\NotificationsUtilisateur;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * @return array{non_lues: int, recentes: array<int, array<string, mixed>>}|null
     */
    private function notificationsDuPersonnel(Request $request): ?array
    {
        $utilisateur = $request->user();

        if ($utilisateur === null || $utilisateur->role === 'client') {
            return null;
        }

        return NotificationsUtilisateur::resume($utilisateur);
    }

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
                // Source unique cote serveur (evite la duplication de FULL_ACCESS_ROLES
                // qui existait cote frontend avant la Phase 09).
                'fullAccess' => in_array($request->user()?->role, ['administrateur', 'proprietaire', 'gerant'], true),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            // Centre de notifications (Phase 12) : la cloche vit dans l'en-tete du
            // back-office, donc sur toutes ses pages — le compteur voyage avec les props
            // globales plutot que via une requete dediee a chaque rendu.
            //
            // Calcule uniquement pour le personnel : le portail public et les comptes
            // client n'ont pas de cloche, leur faire payer deux requetes par page serait
            // gratuit. Le rechargement partiel du sondage ne demande que cette cle.
            'notifications' => $this->notificationsDuPersonnel($request),
        ];
    }
}
