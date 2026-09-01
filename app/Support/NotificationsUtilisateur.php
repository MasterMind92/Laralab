<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Notifications\DatabaseNotification;

/**
 * Mise en forme des notifications internes pour l'écran (Phase 12). Une seule définition
 * de la forme envoyée au front, partagée par les props Inertia globales (la cloche, sur
 * chaque page) et par la page de liste — sinon les deux divergent au premier champ ajouté.
 */
class NotificationsUtilisateur
{
    /**
     * Ce que la cloche a besoin de savoir, et rien de plus : un compteur et les toutes
     * dernières. La liste complète vit sur sa propre page.
     *
     * @return array{non_lues: int, recentes: array<int, array<string, mixed>>}
     */
    public static function resume(User $utilisateur, int $limite = 8): array
    {
        return [
            'non_lues' => $utilisateur->unreadNotifications()->count(),
            'recentes' => $utilisateur->notifications()
                ->latest()
                ->limit($limite)
                ->get()
                ->map(fn (DatabaseNotification $n) => self::ligne($n))
                ->all(),
        ];
    }

    /**
     * `data` est stocké en JSON par le canal database ; les clés viennent toutes de
     * NotificationInterne::toArray(). Les valeurs par défaut couvrent le cas d'une
     * notification écrite par une version antérieure du code — une cloche ne doit jamais
     * casser une page à cause d'une ligne d'historique mal formée.
     *
     * @return array<string, mixed>
     */
    public static function ligne(DatabaseNotification $notification): array
    {
        $data = $notification->data;

        return [
            'id' => $notification->id,
            'titre' => $data['titre'] ?? 'Notification',
            'message' => $data['message'] ?? '',
            'url' => $data['url'] ?? null,
            'niveau' => $data['niveau'] ?? 'info',
            'pole' => $data['pole'] ?? null,
            'lue' => $notification->read_at !== null,
            'date' => $notification->created_at?->toIso8601String(),
        ];
    }
}
