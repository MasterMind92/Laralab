import { Head, router } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import SejourController from '@/actions/App/Http/Controllers/SejourController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table/data-table';
import { ExportDialog } from '@/components/data-table/export-dialog';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import EtatLieuxDialog, { type DommageRow } from '@/components/fullcalendar/EtatLieuxDialog';

type StatutSejour = 'en_cours' | 'cloture';

type DommageResume = { id: number; description: string; montant: string | null };

type SejourRow = {
    id: number;
    date_entree: string;
    date_sortie: string | null;
    etat_lieux_entree: string | null;
    etat_lieux_sortie: string | null;
    statut: StatutSejour;
    dommages: DommageResume[];
    reservation: {
        id: number;
        appartement: { id: number; numero: string; equipements: { id: number; nom: string }[] } | null;
        client: { id: number; nom: string; prenom: string } | null;
    } | null;
};

const STATUT_LABELS: Record<StatutSejour, string> = {
    en_cours: 'En cours',
    cloture: 'Clôturé',
};

function fmt(d: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function SejoursIndex({ sejours }: { sejours: SejourRow[] }) {
    const [processing, setProcessing] = useState(false);
    const [details, setDetails] = useState<SejourRow | null>(null);
    const [checkoutTarget, setCheckoutTarget] = useState<SejourRow | null>(null);

    function destroy(sejour: SejourRow) {
        if (!confirm(`Supprimer le séjour #${sejour.id} ?`)) return;
        router.delete(SejourController.destroy(sejour.id).url, { preserveScroll: true });
    }

    function checkout(etatLieuxSortie: string, dommages?: DommageRow[]) {
        if (!checkoutTarget) return;
        setProcessing(true);
        router.patch(
            SejourController.checkout(checkoutTarget.id).url,
            { etat_lieux_sortie: etatLieuxSortie, dommages },
            { preserveScroll: true, onFinish: () => setProcessing(false), onSuccess: () => setCheckoutTarget(null) },
        );
    }

    const columns: ColumnDef<SejourRow>[] = [
        {
            id: 'appartement',
            header: 'Appartement',
            accessorFn: (s) => s.reservation?.appartement?.numero ?? '',
            cell: ({ row }) => row.original.reservation?.appartement?.numero ?? '—',
        },
        {
            id: 'client',
            header: 'Client',
            accessorFn: (s) => `${s.reservation?.client?.nom ?? ''} ${s.reservation?.client?.prenom ?? ''}`,
        },
        {
            accessorKey: 'date_entree',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Entrée <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => fmt(row.original.date_entree),
        },
        {
            accessorKey: 'date_sortie',
            header: 'Sortie',
            cell: ({ row }) => fmt(row.original.date_sortie),
        },
        {
            accessorKey: 'statut',
            header: 'Statut',
            cell: ({ row }) => (
                <Badge variant={row.original.statut === 'en_cours' ? 'default' : 'secondary'}>
                    {STATUT_LABELS[row.original.statut]}
                </Badge>
            ),
        },
        {
            id: 'dommages',
            header: 'Dommages',
            cell: ({ row }) => (row.original.dommages.length ? `${row.original.dommages.length} signalé(s)` : '—'),
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const sejour = row.original;
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
                            <DropdownMenuItem onClick={() => setDetails(sejour)}>Voir détails</DropdownMenuItem>
                            {sejour.statut === 'en_cours' && (
                                <DropdownMenuItem onClick={() => setCheckoutTarget(sejour)}>Effectuer le check-out</DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => destroy(sejour)}>
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
            <Head title="Séjours" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h1 className="text-2xl font-semibold">Séjours</h1>
                <DataTable
                    columns={columns}
                    data={sejours}
                    searchPlaceholder="Rechercher un client, un appartement..."
                    toolbar={<ExportDialog exportUrl={SejourController.export().url} />}
                />
            </div>

            <Dialog open={details !== null} onOpenChange={(open) => !open && setDetails(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {details?.reservation?.appartement?.numero} — {details?.reservation?.client?.nom}{' '}
                            {details?.reservation?.client?.prenom}
                        </DialogTitle>
                    </DialogHeader>
                    {details && (
                        <div className="space-y-3 text-sm">
                            <p>
                                <span className="text-muted-foreground">Séjour : </span>
                                {fmt(details.date_entree)} → {fmt(details.date_sortie)}
                            </p>
                            <div>
                                <p className="text-muted-foreground mb-1">État des lieux d'entrée</p>
                                <p className="whitespace-pre-line rounded-md border p-2 text-xs">
                                    {details.etat_lieux_entree ?? 'Non renseigné'}
                                </p>
                            </div>
                            {details.etat_lieux_sortie && (
                                <div>
                                    <p className="text-muted-foreground mb-1">État des lieux de sortie</p>
                                    <p className="whitespace-pre-line rounded-md border p-2 text-xs">{details.etat_lieux_sortie}</p>
                                </div>
                            )}
                            {details.dommages.length > 0 && (
                                <div>
                                    <p className="text-muted-foreground mb-1">Dommages constatés</p>
                                    <div className="space-y-1">
                                        {details.dommages.map((d) => (
                                            <div key={d.id} className="flex justify-between rounded-md border p-2 text-xs">
                                                <span>{d.description}</span>
                                                {d.montant && <span>{Number(d.montant).toLocaleString('fr-FR')} FCFA</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <EtatLieuxDialog
                open={checkoutTarget !== null}
                onOpenChange={(open) => !open && setCheckoutTarget(null)}
                title={`Check-out — ${checkoutTarget?.reservation?.appartement?.numero ?? ''}`}
                submitLabel="Valider le check-out"
                processing={processing}
                equipements={checkoutTarget?.reservation?.appartement?.equipements ?? []}
                showDommages
                onSubmit={({ etatLieux, dommages }) => checkout(etatLieux, dommages)}
            />
        </>
    );
}

SejoursIndex.layout = {
    breadcrumbs: [{ title: 'Séjours', href: SejourController.index() }],
};
