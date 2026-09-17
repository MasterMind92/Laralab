import { Head, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { DataTable } from '@/components/data-table/data-table';
import { ExportDialog } from '@/components/data-table/export-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const TOUS = '__tous__';

type Action = 'creation' | 'modification' | 'suppression' | 'restauration';

type LigneJournal = {
    id: number;
    action: Action;
    entite: string;
    auditable_id: number;
    donnees: Record<string, { avant: unknown; apres: unknown }> | Record<string, unknown> | null;
    utilisateur: string | null;
    date: string;
};

const ACTION_LABELS: Record<Action, string> = {
    creation: 'Création',
    modification: 'Modification',
    suppression: 'Suppression',
    restauration: 'Restauration',
};

const ACTION_VARIANTS: Record<Action, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    creation: 'secondary',
    modification: 'default',
    suppression: 'destructive',
    restauration: 'outline',
};

/**
 * Journal d'audit (extension Phase 08) — vue Direction. Les 500 lignes les plus récentes
 * (voir JournalAuditController::index) ; les filtres ci-dessous, et l'export CSV, portent
 * sur l'ensemble du journal, pas seulement cette page.
 */
export default function JournalAudit({
    lignes,
    entites,
    utilisateurs,
    filters,
}: {
    lignes: LigneJournal[];
    entites: { valeur: string; libelle: string }[];
    utilisateurs: { id: number; name: string }[];
    filters: { entite?: string | null; action?: Action | null; user_id?: number | null; du?: string | null; au?: string | null };
}) {
    const [entite, setEntite] = useState(filters.entite ?? TOUS);
    const [action, setAction] = useState(filters.action ?? TOUS);
    const [userId, setUserId] = useState(filters.user_id ? String(filters.user_id) : TOUS);
    const [du, setDu] = useState(filters.du ?? '');
    const [au, setAu] = useState(filters.au ?? '');

    function filtrer(e: FormEvent) {
        e.preventDefault();
        // window.location.pathname, pas JournalAuditController.index().url : cette page
        // sert aussi bien /admin/journal-audit (administrateur) que
        // /admin/mon-journal-audit (proprietaire/gerant) — cibler l'URL fixe casserait le
        // filtre pour ce deuxieme groupe (403, route reservee a l'administrateur).
        router.get(
            window.location.pathname,
            {
                entite: entite === TOUS ? undefined : entite,
                action: action === TOUS ? undefined : action,
                user_id: userId === TOUS ? undefined : userId,
                du: du || undefined,
                au: au || undefined,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    // window.location.pathname + '/export', pas JournalAuditController.export().url : meme
    // raison que pour le filtre ci-dessus, cette page sert deux routes.
    const exportUrl =
        window.location.pathname +
        '/export?' +
        `${new URLSearchParams({
            ...(entite !== TOUS ? { entite } : {}),
            ...(action !== TOUS ? { action } : {}),
            ...(userId !== TOUS ? { user_id: userId } : {}),
        }).toString()}`;

    const columns: ColumnDef<LigneJournal>[] = [
        {
            id: 'date',
            header: 'Date',
            accessorFn: (l) => l.date,
            cell: ({ row }) => (
                <span className="text-xs">
                    {new Date(row.original.date).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
            ),
        },
        {
            id: 'utilisateur',
            header: 'Utilisateur',
            accessorFn: (l) => l.utilisateur ?? 'Système',
            cell: ({ row }) => <span className="text-sm">{row.original.utilisateur ?? 'Système'}</span>,
        },
        {
            id: 'action',
            header: 'Action',
            accessorFn: (l) => ACTION_LABELS[l.action],
            cell: ({ row }) => <Badge variant={ACTION_VARIANTS[row.original.action]}>{ACTION_LABELS[row.original.action]}</Badge>,
        },
        {
            id: 'entite',
            header: 'Entité',
            accessorFn: (l) => l.entite,
            cell: ({ row }) => (
                <span className="font-mono text-sm">
                    {row.original.entite} #{row.original.auditable_id}
                </span>
            ),
        },
        {
            id: 'donnees',
            header: 'Détail',
            cell: ({ row }) => {
                const donnees = row.original.donnees;

                if (!donnees || Object.keys(donnees).length === 0) {
                    return <span className="text-xs text-muted-foreground">—</span>;
                }

                return (
                    <span className="text-xs text-muted-foreground">
                        {Object.keys(donnees).slice(0, 3).join(', ')}
                        {Object.keys(donnees).length > 3 ? '…' : ''}
                    </span>
                );
            },
        },
    ];

    return (
        <>
            <Head title="Journal d'audit" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold">Journal d'audit</h1>
                        <p className="text-sm text-muted-foreground">
                            {lignes.length} ligne{lignes.length > 1 ? 's' : ''} récente{lignes.length > 1 ? 's' : ''}
                        </p>
                    </div>
                    <ExportDialog exportUrl={exportUrl} />
                </div>

                <form
                    onSubmit={filtrer}
                    className="grid grid-cols-2 gap-3 rounded-md border p-3 md:grid-cols-5 md:items-end"
                >
                    <div className="grid gap-1.5">
                        <Label htmlFor="f-entite">Entité</Label>
                        <Select value={entite} onValueChange={setEntite}>
                            <SelectTrigger id="f-entite">
                                <SelectValue placeholder="Toutes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TOUS}>Toutes</SelectItem>
                                {entites.map((e) => (
                                    <SelectItem key={e.valeur} value={e.valeur}>
                                        {e.libelle}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="f-action">Action</Label>
                        <Select value={action} onValueChange={setAction}>
                            <SelectTrigger id="f-action">
                                <SelectValue placeholder="Toutes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TOUS}>Toutes</SelectItem>
                                {Object.entries(ACTION_LABELS).map(([cle, libelle]) => (
                                    <SelectItem key={cle} value={cle}>
                                        {libelle}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="f-user">Utilisateur</Label>
                        <Select value={userId} onValueChange={setUserId}>
                            <SelectTrigger id="f-user">
                                <SelectValue placeholder="Tous" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TOUS}>Tous</SelectItem>
                                {utilisateurs.map((u) => (
                                    <SelectItem key={u.id} value={String(u.id)}>
                                        {u.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="f-du">Du</Label>
                        <Input id="f-du" type="date" value={du} onChange={(e) => setDu(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                        <Input type="date" aria-label="Au" value={au} onChange={(e) => setAu(e.target.value)} />
                        <Button type="submit">Filtrer</Button>
                    </div>
                </form>

                <DataTable columns={columns} data={lignes} searchPlaceholder="Rechercher dans le journal..." />
            </div>
        </>
    );
}
