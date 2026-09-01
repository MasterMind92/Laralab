import { Link, router, usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { useEffect } from 'react';
import NotificationController from '@/actions/App/Http/Controllers/NotificationController';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Centre de notifications internes (Phase 12) — la cloche du back-office.
 *
 * Les données arrivent par les props partagées Inertia (HandleInertiaRequests) : la
 * cloche est présente sur toutes les pages du back-office, une requête dédiée par rendu
 * serait du gaspillage. La prop vaut `null` pour un visiteur du portail ou un compte
 * client, qui n'ont pas de cloche — d'où le rendu vide plutôt qu'une cloche à zéro.
 */
export type NotificationLigne = {
    id: string;
    titre: string;
    message: string;
    url: string | null;
    niveau: 'info' | 'alerte' | 'critique';
    pole: string | null;
    lue: boolean;
    date: string | null;
};

export type NotificationsPartagees = {
    non_lues: number;
    recentes: NotificationLigne[];
} | null;

/**
 * Sondage plutôt que websockets (décision du 2026-09-01) : back-office, poignée
 * d'utilisateurs, une minute de latence sur « une panne a été signalée » ne coûte rien —
 * là où Laravel Reverb ajouterait un service à faire tourner en local comme en production.
 */
const INTERVALLE_SONDAGE_MS = 60_000;

const COULEURS_NIVEAU: Record<NotificationLigne['niveau'], string> = {
    info: 'bg-muted-foreground',
    alerte: 'bg-amber-500',
    critique: 'bg-destructive',
};

function ilYA(date: string | null): string {
    if (!date) {
        return '';
    }

    const minutes = Math.round((Date.now() - new Date(date).getTime()) / 60000);

    if (minutes < 1) {
        return "à l'instant";
    }

    if (minutes < 60) {
        return `il y a ${minutes} min`;
    }

    if (minutes < 60 * 24) {
        return `il y a ${Math.round(minutes / 60)} h`;
    }

    return `il y a ${Math.round(minutes / (60 * 24))} j`;
}

export function NotificationBell() {
    const { notifications } = usePage<{
        notifications: NotificationsPartagees;
    }>().props;

    useEffect(() => {
        if (!notifications) {
            return;
        }

        const minuteur = setInterval(() => {
            // Rechargement partiel : seule la prop `notifications` est recalculée côté
            // serveur, le reste de la page n'est ni requêté ni re-rendu.
            router.reload({ only: ['notifications'] });
        }, INTERVALLE_SONDAGE_MS);

        return () => clearInterval(minuteur);
    }, [notifications]);

    if (!notifications) {
        return null;
    }

    const { non_lues: nonLues, recentes } = notifications;

    /**
     * Une SEULE visite : le serveur marque lu puis redirige. La version precedente lancait
     * un PATCH de marquage suivi immediatement d'une visite — or Inertia annule la requete
     * en cours des qu'une nouvelle demarre, si bien que les deux s'annulaient et que la
     * navigation ne partait pas.
     */
    function ouvrir(notification: NotificationLigne) {
        router.visit(NotificationController.ouvrir(notification.id).url);
    }

    function toutMarquerLu() {
        router.patch(
            NotificationController.toutMarquerLu().url,
            {},
            { preserveScroll: true, preserveState: true },
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label={
                        nonLues > 0
                            ? `Notifications — ${nonLues} non lue${nonLues > 1 ? 's' : ''}`
                            : 'Notifications'
                    }
                >
                    <Bell className="h-4 w-4" />
                    {nonLues > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white tabular-nums">
                            {nonLues > 99 ? '99+' : nonLues}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                // Le panneau est plafonne et defile : avec huit notifications recentes il
                // depassait la fenetre, et le contenu sous la ligne de flottaison etait
                // simplement inatteignable. La liste defile, l'en-tete et le lien de bas
                // de panneau restent atteignables parce qu'ils sont hors de la zone qui
                // defile.
                className="flex max-h-[70vh] w-96 flex-col overflow-hidden"
            >
                <DropdownMenuLabel className="flex items-center justify-between gap-2">
                    <span>Notifications</span>
                    {nonLues > 0 && (
                        <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            onClick={toutMarquerLu}
                        >
                            Tout marquer comme lu
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <div className="min-h-0 flex-1 overflow-y-auto">
                    {recentes.length === 0 ? (
                        <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                            Aucune notification.
                        </p>
                    ) : (
                        recentes.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className="flex items-start gap-2 py-2 whitespace-normal"
                                onClick={() => ouvrir(notification)}
                            >
                                <span
                                    aria-hidden="true"
                                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                        notification.lue
                                            ? 'bg-transparent'
                                            : COULEURS_NIVEAU[
                                                  notification.niveau
                                              ]
                                    }`}
                                />
                                <span className="space-y-0.5">
                                    <span
                                        className={`block text-xs ${notification.lue ? 'font-normal' : 'font-semibold'}`}
                                    >
                                        {notification.titre}
                                    </span>
                                    <span className="block text-xs text-muted-foreground">
                                        {notification.message}
                                    </span>
                                    <span className="block text-[10px] text-muted-foreground">
                                        {ilYA(notification.date)}
                                    </span>
                                </span>
                            </DropdownMenuItem>
                        ))
                    )}
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link
                        href={NotificationController.index().url}
                        className="justify-center text-xs"
                    >
                        Voir toutes les notifications
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
