<?php

namespace App\Http\Controllers;

use App\Support\NotificationsUtilisateur;
use App\Support\Poles;
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

        $utilisateur = $request->user();

        $notifications = $utilisateur->notifications()
            ->when($filtres['pole'] ?? null, fn ($q, $pole) => $q->where('data->pole', $pole))
            ->when($filtres['niveau'] ?? null, fn ($q, $niveau) => $q->where('data->niveau', $niveau))
            ->when(($filtres['etat'] ?? null) === 'non_lues', fn ($q) => $q->whereNull('read_at'))
            ->when(($filtres['etat'] ?? null) === 'lues', fn ($q) => $q->whereNotNull('read_at'))
            ->latest()
            // Plafond volontaire : l'historique croît sans fin et la page filtre côté
            // client une fois les données reçues. Au-delà, ce sont les filtres ci-dessus
            // qui servent.
            ->limit(self::PLAFOND)
            ->get()
            ->map(fn (DatabaseNotification $n) => NotificationsUtilisateur::ligne($n))
            ->all();

        return Inertia::render('notifications/index', [
            // `lignes` et surtout PAS `notifications` : le middleware partage deja une
            // prop globale `notifications` (le resume de la cloche, present sur toutes
            // les pages du back-office). Une prop de page du meme nom l'ecrase, et la
            // cloche recevait alors un tableau la ou elle attend { non_lues, recentes } —
            // elle plantait au rendu, sur la seule page justement dediee aux
            // notifications.
            'lignes' => $notifications,
            // Les compteurs par pôle portent sur TOUT l'historique, pas sur la page
            // filtrée : un en-tête de section qui annoncerait « 0 non lue » simplement
            // parce qu'un filtre est actif dirait le contraire de la vérité.
            'poles' => $this->compteursParPole($request),
            // Le pôle de l'utilisateur passe en tête de page, comme son menu est déroulé
            // d'office dans la barre latérale : c'est son travail, il vient avant la
            // supervision des autres.
            'poleUtilisateur' => Poles::pourUtilisateur($utilisateur),
            'filters' => $filtres,
            'plafond' => self::PLAFOND,
        ]);
    }

    /**
     * Total et non-lues par pôle, sur l'historique entier.
     *
     * Regroupement en PHP et non en SQL : extraire `data->pole` dans un GROUP BY oblige à
     * écrire du JSON SQL, dont la syntaxe diffère entre MySQL (l'exécution) et SQLite (la
     * suite de tests). Une seule requête, deux colonnes, et un volume borné par
     * utilisateur — le compromis penche du côté du portable.
     *
     * @return array<int, array{valeur: string, libelle: string, total: int, non_lues: int}>
     */
    private function compteursParPole(Request $request): array
    {
        return $request->user()->notifications()
            ->get(['data', 'read_at'])
            ->groupBy(fn (DatabaseNotification $n) => $n->data['pole'] ?? '')
            ->map(fn ($groupe, $pole) => [
                'valeur' => (string) $pole,
                'libelle' => Poles::libelle((string) $pole),
                'total' => $groupe->count(),
                'non_lues' => $groupe->whereNull('read_at')->count(),
            ])
            ->sortBy(fn (array $ligne) => sprintf('%03d-%s', Poles::rang($ligne['valeur']), $ligne['libelle']))
            ->values()
            ->all();
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

    /**
     * Solde les non-lues : toutes, ou celles d'un seul pôle quand la page envoie `pole`.
     *
     * Le marquage par pôle existe parce que c'est le geste réel de l'utilisateur — « j'ai
     * traité la Maintenance » — alors qu'un « tout marquer lu » global enterre au passage
     * les alertes des autres services, qu'il n'a pas regardées.
     */
    public function toutMarquerLu(Request $request): RedirectResponse
    {
        $filtre = $request->validate([
            'pole' => ['nullable', 'string', 'max:50'],
        ]);

        $pole = $filtre['pole'] ?? null;

        $request->user()->unreadNotifications()
            ->when($pole !== null, fn ($q) => $q->where('data->pole', $pole))
            ->update(['read_at' => now()]);

        return back();
    }

    public function destroy(Request $request, string $notification): RedirectResponse
    {
        $request->user()->notifications()->whereKey($notification)->firstOrFail()->delete();

        return back();
    }
}
