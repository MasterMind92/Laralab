import { Head, router } from '@inertiajs/react';
import {
    Bell,
    Building2,
    CheckCheck,
    ConciergeBell,
    ExternalLink,
    Handshake,
    Inbox,
    Mail,
    MailOpen,
    MoreHorizontal,
    Receipt,
    Trash2,
    Truck,
    Users,
    Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import NotificationController from '@/actions/App/Http/Controllers/NotificationController';
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
import { Input } from '@/components/ui/input';
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
 * Une SEULE page, découpée en sections par pôle : on ne consulte pas ses notifications par
 * ordre d'arrivée, on vient traiter un service — « où en est la Maintenance ». Des pages
 * séparées par pôle auraient dilué le compteur de la cloche entre plusieurs destinations,
 * et obligé à en visiter quatre pour savoir s'il reste du travail.
 *
 * Le type de ligne est importé du composant cloche : une seule définition de la forme
 * servie par le serveur, sinon les deux divergent au premier champ ajouté.
 */
type PoleCompteur = {
    valeur: string;
    libelle: string;
    total: number;
    non_lues: number;
};

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

/**
 * Une icône par pôle, pour que la section se reconnaisse avant d'être lue. Un pôle hors
 * catalogue tombe sur la cloche générique : l'écran ne doit pas casser parce qu'un
 * émetteur a inventé un pôle.
 */
const POLE_ICONES: Record<string, LucideIcon> = {
    maintenance: Wrench,
    reception: ConciergeBell,
    comptabilite: Receipt,
    rh: Users,
    logistique: Truck,
    commercial: Handshake,
    direction: Building2,
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
    // Le serveur envoie `lignes`, jamais `notifications` : ce dernier nom est pris par la
    // prop partagee de la cloche, presente sur toutes les pages. Une prop de page
    // homonyme l'ecrase et fait planter la cloche.
    lignes: notifications,
    poles,
    poleUtilisateur,
    filters,
    plafond,
}: {
    lignes: NotificationLigne[];
    poles: PoleCompteur[];
    poleUtilisateur: string | null;
    filters: Filters;
    plafond: number;
}) {
    const [pole, setPole] = useState<string>(filters.pole ?? TOUS);
    const [niveau, setNiveau] = useState<string>(filters.niveau ?? TOUS);
    const [etat, setEtat] = useState<string>(filters.etat ?? TOUS);
    const [recherche, setRecherche] = useState('');

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
        setRecherche('');
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

    function ouvrir(notification: NotificationLigne) {
        // Toujours passer par la route serveur : elle marque lue ET redirige en une seule
        // requête. Faire les deux côté client relançait deux visites Inertia, dont la
        // seconde annulait la première.
        if (notification.url) {
            router.visit(NotificationController.ouvrir(notification.id).url);

            return;
        }

        // Sans destination, le clic ne peut que solder la ligne.
        if (!notification.lue) {
            basculerLecture(notification);
        }
    }

    function supprimer(notification: NotificationLigne) {
        if (!confirm('Supprimer cette notification ?')) {
            return;
        }

        router.delete(NotificationController.destroy(notification.id).url, {
            preserveScroll: true,
        });
    }

    function marquerLu(polePorte?: string) {
        router.patch(
            NotificationController.toutMarquerLu().url,
            polePorte ? { pole: polePorte } : {},
            { preserveScroll: true },
        );
    }

    // La recherche est locale : les lignes sont déjà en mémoire, un aller-retour serveur
    // par frappe n'apporterait rien.
    const visibles = useMemo(() => {
        const terme = recherche.trim().toLowerCase();

        if (terme === '') {
            return notifications;
        }

        return notifications.filter((n) =>
            `${n.titre} ${n.message}`.toLowerCase().includes(terme),
        );
    }, [notifications, recherche]);

    /**
     * Les sections, dans l'ordre du catalogue serveur, avec le pôle de l'utilisateur hissé
     * en tête : c'est son travail, il passe avant la supervision des autres. Un pôle
     * présent dans les données mais absent du catalogue (émetteur plus récent que cet
     * écran) obtient quand même sa section, en fin de liste.
     */
    const sections = useMemo(() => {
        const parPole = new Map<string, NotificationLigne[]>();

        for (const ligne of visibles) {
            const cle = ligne.pole ?? '';
            const groupe = parPole.get(cle);

            if (groupe) {
                groupe.push(ligne);
            } else {
                parPole.set(cle, [ligne]);
            }
        }

        const connus = poles.map((p) => p.valeur);
        const ordre = [
            ...connus,
            ...[...parPole.keys()].filter((cle) => !connus.includes(cle)),
        ];

        return ordre
            .filter((cle) => parPole.has(cle))
            .sort((a, b) => {
                if (a === b) {
                    return 0;
                }

                if (a === poleUtilisateur) {
                    return -1;
                }

                if (b === poleUtilisateur) {
                    return 1;
                }

                return ordre.indexOf(a) - ordre.indexOf(b);
            })
            .map((cle) => {
                const compteur = poles.find((p) => p.valeur === cle);

                return {
                    valeur: cle,
                    libelle: compteur?.libelle ?? (cle === '' ? 'Autres' : cle),
                    nonLuesHistorique: compteur?.non_lues ?? 0,
                    lignes: parPole.get(cle) ?? [],
                };
            });
    }, [visibles, poles, poleUtilisateur]);

    const nonLues = notifications.filter((n) => !n.lue).length;
    const nonLuesTotal = poles.reduce((somme, p) => somme + p.non_lues, 0);

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
                            {visibles.length} affichée
                            {visibles.length > 1 ? 's' : ''} · {nonLues} non lue
                            {nonLues > 1 ? 's' : ''}
                            {notifications.length >= plafond &&
                                ` · au-delà de ${plafond}, utilisez les filtres`}
                        </p>
                    </div>
                    {nonLuesTotal > 0 && (
                        <Button variant="outline" onClick={() => marquerLu()}>
                            <CheckCheck className="mr-2 h-4 w-4" />
                            Tout marquer comme lu ({nonLuesTotal})
                        </Button>
                    )}
                </div>

                <form
                    onSubmit={filtrer}
                    className="grid grid-cols-2 gap-3 rounded-md border p-3 md:grid-cols-5 md:items-end"
                >
                    <div className="grid gap-1.5">
                        <Label htmlFor="f-pole">Pôle</Label>
                        <Select value={pole} onValueChange={setPole}>
                            <SelectTrigger id="f-pole">
                                <SelectValue placeholder="Tous" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TOUS}>Tous</SelectItem>
                                {poles
                                    .filter((p) => p.valeur !== '')
                                    .map((p) => (
                                        <SelectItem
                                            key={p.valeur}
                                            value={p.valeur}
                                        >
                                            {p.libelle} ({p.total})
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

                    <div className="grid gap-1.5">
                        <Label htmlFor="f-recherche">Recherche</Label>
                        <Input
                            id="f-recherche"
                            value={recherche}
                            onChange={(e) => setRecherche(e.target.value)}
                            placeholder="Titre ou message..."
                        />
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

                {sections.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-md border border-dashed py-16 text-center">
                        <Inbox className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm font-medium">
                            Aucune notification
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {notifications.length === 0
                                ? 'Rien ne vous attend pour le moment.'
                                : 'Aucune ligne ne correspond à ces critères.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {sections.map((section) => {
                            const Icone = POLE_ICONES[section.valeur] ?? Bell;

                            return (
                                <section
                                    key={section.valeur || '__sans_pole__'}
                                    className="overflow-hidden rounded-md border"
                                >
                                    <header className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Icone className="h-4 w-4 text-muted-foreground" />
                                            <h2 className="text-sm font-semibold">
                                                {section.libelle}
                                            </h2>
                                            {section.valeur ===
                                                poleUtilisateur && (
                                                <Badge variant="outline">
                                                    Mon pôle
                                                </Badge>
                                            )}
                                            <span className="text-xs text-muted-foreground">
                                                {section.lignes.length} affichée
                                                {section.lignes.length > 1
                                                    ? 's'
                                                    : ''}
                                                {section.nonLuesHistorique >
                                                    0 &&
                                                    ` · ${section.nonLuesHistorique} non lue${
                                                        section.nonLuesHistorique >
                                                        1
                                                            ? 's'
                                                            : ''
                                                    } au total`}
                                            </span>
                                        </div>
                                        {/* Pas de bouton sur le groupe « Autres » : il ne
                                            correspond à aucun pôle, donc à aucun filtre
                                            serveur — il ne recueille que des lignes
                                            d'historique malformées. */}
                                        {section.valeur !== '' &&
                                            section.nonLuesHistorique > 0 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        marquerLu(
                                                            section.valeur,
                                                        )
                                                    }
                                                >
                                                    <CheckCheck className="mr-2 h-4 w-4" />
                                                    Marquer ce pôle lu
                                                </Button>
                                            )}
                                    </header>

                                    <ul className="divide-y">
                                        {section.lignes.map((notification) => (
                                            <li
                                                key={notification.id}
                                                className="flex items-start gap-1"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        ouvrir(notification)
                                                    }
                                                    className="flex min-w-0 flex-1 items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                                                >
                                                    {/* La pastille tient lieu d'état : un
                                                        badge « Non lue » sur chaque ligne
                                                        bruiterait la liste entière. */}
                                                    <span
                                                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                                            notification.lue
                                                                ? 'bg-transparent'
                                                                : 'bg-primary'
                                                        }`}
                                                        aria-hidden
                                                    />
                                                    <div className="min-w-0 flex-1 space-y-0.5">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p
                                                                className={
                                                                    notification.lue
                                                                        ? 'text-sm text-muted-foreground'
                                                                        : 'text-sm font-semibold'
                                                                }
                                                            >
                                                                {
                                                                    notification.titre
                                                                }
                                                            </p>
                                                            {notification.niveau !==
                                                                'info' && (
                                                                <Badge
                                                                    variant={
                                                                        NIVEAU_VARIANTS[
                                                                            notification
                                                                                .niveau
                                                                        ]
                                                                    }
                                                                >
                                                                    {
                                                                        NIVEAU_LABELS[
                                                                            notification
                                                                                .niveau
                                                                        ]
                                                                    }
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            {
                                                                notification.message
                                                            }
                                                        </p>
                                                    </div>
                                                    <span className="shrink-0 pt-0.5 text-xs whitespace-nowrap text-muted-foreground">
                                                        {fmtDateHeure(
                                                            notification.date,
                                                        )}
                                                    </span>
                                                </button>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            className="mt-1.5 mr-1 h-8 w-8 shrink-0 p-0"
                                                        >
                                                            <span className="sr-only">
                                                                Ouvrir le menu
                                                            </span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>
                                                            Actions
                                                        </DropdownMenuLabel>
                                                        {notification.url && (
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    ouvrir(
                                                                        notification,
                                                                    )
                                                                }
                                                            >
                                                                <ExternalLink />{' '}
                                                                Ouvrir
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                basculerLecture(
                                                                    notification,
                                                                )
                                                            }
                                                        >
                                                            {notification.lue ? (
                                                                <>
                                                                    <Mail />
                                                                    <span>
                                                                        Marquer comme non lue
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <MailOpen />
                                                                    <span>
                                                                        Marquer comme lue
                                                                    </span>
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                supprimer(
                                                                    notification,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="text-red-500" />
                                                            <span className="text-red-500">
                                                                Supprimer
                                                            </span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}

NotificationsIndex.layout = {
    breadcrumbs: [
        { title: 'Notifications', href: NotificationController.index() },
    ],
};
