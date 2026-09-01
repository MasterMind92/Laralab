<?php

namespace App\Http\Controllers;

use App\Support\NotificationsUtilisateur;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Centre de notifications interne (Phase 12) — la convention de conception n°3, actée le
 * 2026-08-06 et restée conceptuelle jusqu'ici.
 *
 * Règle de sécurité qui gouverne tout ce contrôleur : une notification n'est JAMAIS
 * résolue par liaison de modèle sur son identifiant, mais toujours retrouvée dans la
 * collection de l'utilisateur connecté. Un identifiant est un UUID, donc impossible à
 * deviner — mais « impossible à deviner » n'est pas un contrôle d'accès, et la liaison
 * globale laisserait n'importe qui marquer lue ou supprimer la notification d'autrui en
 * connaissant son identifiant.
 */
class NotificationController extends Controller
{
    private const PLAFOND = 200;

    public function index(Request $request): Response
    {
        $filtres = $request->validate([
            'pole' => ['nullable', 'string', 'max:50'],
            'niveau' => ['nullable', 'in:info,alerte,critique'],
            'etat' => ['nullable', 'in:non_lues,lues'],
        ]);

        $notifications = $request->user()->notifications()
            ->when($filtres['pole'] ?? null, fn ($q, $pole) => $q->where('data->pole', $pole))
            ->when($filtres['niveau'] ?? null, fn ($q, $niveau) => $q->where('data->niveau', $niveau))
            ->when(($filtres['etat'] ?? null) === 'non_lues', fn ($q) => $q->whereNull('read_at'))
            ->when(($filtres['etat'] ?? null) === 'lues', fn ($q) => $q->whereNotNull('read_at'))
            ->latest()
            // Plafond volontaire : l'historique croît sans fin et la DataTable du projet
            // filtre côté client. Au-delà, ce sont les filtres ci-dessus qui servent.
            ->limit(self::PLAFOND)
            ->get()
            ->map(fn (DatabaseNotification $n) => NotificationsUtilisateur::ligne($n))
            ->all();

        return Inertia::render('notifications/index', [
            'notifications' => $notifications,
            'filters' => $filtres,
            'plafond' => self::PLAFOND,
        ]);
    }

    /**
     * Ouvre une notification : la marque lue ET redirige vers la page concernée, en UNE
     * seule requête.
     *
     * Le front faisait les deux séparément — un PATCH de marquage puis une visite — et
     * Inertia annule la requête en cours dès qu'une nouvelle visite démarre : les deux
     * s'annulaient mutuellement, d'où une navigation qui ne partait pas. Passer par une
     * redirection serveur supprime la course au lieu de la synchroniser côté client.
     *
     * La destination est validée avant redirection : elle vient de notre propre code
     * (NotificationInterne::url()), mais une ligne d'historique reste une donnée stockée,
     * et rediriger sans regarder ouvrirait une redirection ouverte le jour où une
     * notification serait alimentée par une saisie.
     */
    public function ouvrir(Request $request, string $notification): RedirectResponse
    {
        $ligne = $request->user()->notifications()->whereKey($notification)->firstOrFail();
        $ligne->markAsRead();

        $destination = $ligne->data['url'] ?? null;

        // Chemin interne uniquement : commence par un seul '/', jamais '//' (qui serait
        // interprété comme un domaine externe par le navigateur).
        $interne = is_string($destination)
            && str_starts_with($destination, '/')
            && ! str_starts_with($destination, '//');

        return $interne ? redirect()->to($destination) : redirect()->route('notifications.index');
    }

    public function marquerLue(Request $request, string $notification): RedirectResponse
    {
        $request->user()->notifications()->whereKey($notification)->firstOrFail()->markAsRead();

        return back();
    }

    public function marquerNonLue(Request $request, string $notification): RedirectResponse
    {
        $request->user()->notifications()->whereKey($notification)->firstOrFail()->markAsUnread();

        return back();
    }

    public function toutMarquerLu(Request $request): RedirectResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return back();
    }

    public function destroy(Request $request, string $notification): RedirectResponse
    {
        $request->user()->notifications()->whereKey($notification)->firstOrFail()->delete();

        return back();
    }
}
