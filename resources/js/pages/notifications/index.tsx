import { Head, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import NotificationController from '@/actions/App/Http/Controllers/NotificationController';
import { DataTable } from '@/components/data-table/data-table';
import type { NotificationLigne } from '@/components/notification-bell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

/**
 * L'historique complet des notifications de l'utilisateur connecté (Phase 12). La cloche
 * ne montre que les dernières ; c'est ici qu'on retrouve, filtre et purge le reste.
 *
 * Le type de ligne est importé du composant cloche : une seule définition de la forme
 * servie par le serveur, sinon les deux divergent au premier champ ajouté.
 */
type Filters = {
    pole?: string | null;
    niveau?: 'info' | 'alerte' | 'critique' | null;
    etat?: 'non_lues' | 'lues' | null;
};

const TOUS = '__tous__';

const NIVEAU_LABELS: Record<NotificationLigne['niveau'], string> = {
    info: 'Info',
    alerte: 'Alerte',
    critique: 'Critique',
};

const NIVEAU_VARIANTS: Record<
    NotificationLigne['niveau'],
    'default' | 'secondary' | 'destructive' | 'outline'
> = {
    info: 'secondary',
    alerte: 'default',
    critique: 'destructive',
};

function fmtDateHeure(valeur: string | null): string {
    if (!valeur) {
        return '—';
    }

    return new Date(valeur).toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function NotificationsIndex({
    notifications,
    filters,
    plafond,
}: {
    notifications: NotificationLigne[];
    filters: Filters;
    plafond: number;
}) {
    const [pole, setPole] = useState<string>(filters.pole ?? TOUS);
    const [niveau, setNiveau] = useState<string>(filters.niveau ?? TOUS);
    const [etat, setEtat] = useState<string>(filters.etat ?? TOUS);

    // Les pôles émetteurs ne sont pas une liste figée : ils se découvrent dans les
    // données, pour que brancher un nouveau pôle n'oblige pas à revenir modifier ce
    // filtre.
    const poles = Array.from(
        new Set(
            notifications
                .map((n) => n.pole)
                .filter((p): p is string => p !== null),
        ),
    ).sort();

    const criteres = {
        pole: pole === TOUS ? undefined : pole,
        niveau: niveau === TOUS ? undefined : niveau,
        etat: etat === TOUS ? undefined : etat,
    };

    function filtrer(e: FormEvent) {
        e.preventDefault();
        router.get(NotificationController.index().url, criteres, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }

    function reinitialiser() {
        setPole(TOUS);
        setNiveau(TOUS);
        setEtat(TOUS);
        router.get(
            NotificationController.index().url,
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    function basculerLecture(notification: NotificationLigne) {
        const action = notification.lue
            ? NotificationController.marquerNonLue(notification.id)
            : NotificationController.marquerLue(notification.id);

        router.patch(action.url, {}, { preserveScroll: true });
    }

    function supprimer(notification: NotificationLigne) {
        if (!confirm('Supprimer cette notification ?')) {
            return;
        }

        router.delete(NotificationController.destroy(notification.id).url, {
            preserveScroll: true,
        });
    }

    const nonLues = notifications.filter((n) => !n.lue).length;

    const columns: ColumnDef<NotificationLigne>[] = [
        {
            accessorKey: 'titre',
            header: 'Notification',
            cell: ({ row }) => (
                <div className="space-y-0.5">
                    <p
                        className={
                            row.original.lue
                                ? 'text-sm'
                                : 'text-sm font-semibold'
                        }
                    >
                        {row.original.titre}
                    </p>
                    <p className="max-w-md text-xs text-muted-foreground">
                        {row.original.message}
                    </p>
                </div>
            ),
        },
        {
            accessorKey: 'pole',
            header: 'Pôle',
            cell: ({ row }) => (
                <span className="text-xs capitalize">
                    {row.original.pole ?? '—'}
                </span>
            ),
        },
        {
            accessorKey: 'niveau',
            header: 'Niveau',
            cell: ({ row }) => (
                <Badge variant={NIVEAU_VARIANTS[row.original.niveau]}>
                    {NIVEAU_LABELS[row.original.niveau]}
                </Badge>
            ),
        },
        {
            id: 'etat',
            header: 'État',
            accessorFn: (n) => (n.lue ? 'Lue' : 'Non lue'),
            cell: ({ row }) =>
                row.original.lue ? (
                    <span className="text-xs text-muted-foreground">Lue</span>
                ) : (
                    <Badge variant="outline">Non lue</Badge>
                ),
        },
        {
            id: 'date',
            header: 'Reçue le',
            accessorFn: (n) => n.date ?? '',
            cell: ({ row }) => (
                <span className="text-xs">
                    {fmtDateHeure(row.original.date)}
                </span>
            ),
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const notification = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Ouvrir le menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            {notification.url && (
                                <DropdownMenuItem
                                    onClick={() =>
                                        router.visit(
                                            NotificationController.ouvrir(
                                                notification.id,
                                            ).url,
                                        )
                                    }
                                >
                                    Ouvrir
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={() => basculerLecture(notification)}
                            >
                                {notification.lue
                                    ? 'Marquer comme non lue'
                                    : 'Marquer comme lue'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => supprimer(notification)}
                            >
                                <span className="text-red-500">Supprimer</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    return (
        <>
            <Head title="Notifications" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Notifications
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {notifications.length} affichée
                            {notifications.length > 1 ? 's' : ''} · {nonLues}{' '}
                            non lue
                            {nonLues > 1 ? 's' : ''}
                            {notifications.length >= plafond &&
                                ` · au-delà de ${plafond}, utilisez les filtres`}
                        </p>
                    </div>
                    {nonLues > 0 && (
                        <Button
                            variant="outline"
                            onClick={() =>
                                router.patch(
                                    NotificationController.toutMarquerLu().url,
                                    {},
                                    { preserveScroll: true },
                                )
                            }
                        >
                            Tout marquer comme lu
                        </Button>
                    )}
                </div>

                <form
                    onSubmit={filtrer}
                    className="grid grid-cols-2 gap-3 rounded-md border p-3 md:grid-cols-4 md:items-end"
                >
                    <div className="grid gap-1.5">
                        <Label htmlFor="f-pole">Pôle</Label>
                        <Select value={pole} onValueChange={setPole}>
                            <SelectTrigger id="f-pole">
                                <SelectValue placeholder="Tous" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TOUS}>Tous</SelectItem>
                                {poles.map((p) => (
                                    <SelectItem key={p} value={p}>
                                        <span className="capitalize">{p}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="f-niveau">Niveau</Label>
                        <Select value={niveau} onValueChange={setNiveau}>
                            <SelectTrigger id="f-niveau">
                                <SelectValue placeholder="Tous" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TOUS}>Tous</SelectItem>
                                <SelectItem value="critique">
                                    Critique
                                </SelectItem>
                                <SelectItem value="alerte">Alerte</SelectItem>
                                <SelectItem value="info">Info</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="f-etat">État</Label>
                        <Select value={etat} onValueChange={setEtat}>
                            <SelectTrigger id="f-etat">
                                <SelectValue placeholder="Toutes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TOUS}>Toutes</SelectItem>
                                <SelectItem value="non_lues">
                                    Non lues
                                </SelectItem>
                                <SelectItem value="lues">Lues</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-2">
                        <Button type="submit">Filtrer</Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={reinitialiser}
                        >
                            Réinitialiser
                        </Button>
                    </div>
                </form>

                <DataTable
                    columns={columns}
                    data={notifications}
                    searchPlaceholder="Rechercher dans les notifications..."
                />
            </div>
        </>
    );
}

NotificationsIndex.layout = {
    breadcrumbs: [
        { title: 'Notifications', href: NotificationController.index() },
    ],
};
