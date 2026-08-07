import { Head, router } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, CheckCircle2, MoreHorizontal, XCircle } from 'lucide-react';
import { useState } from 'react';
import ReservationController from '@/actions/App/Http/Controllers/ReservationController';
import SejourController from '@/actions/App/Http/Controllers/SejourController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table/data-table';
import { ExportDialog } from '@/components/data-table/export-dialog';
import {
    Dialog,
    DialogContent,
    DialogFooter,
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
import EtatLieuxDialog from '@/components/fullcalendar/EtatLieuxDialog';

type Statut = 'en_attente' | 'validee' | 'annulee' | 'terminee';

type ReservationRow = {
    id: number;
    date_debut: string;
    date_fin: string;
    statut: Statut;
    created_at: string;
    appartement: { id: number; numero: string; equipements: { id: number; nom: string }[] } | null;
    client: { id: number; nom: string; prenom: string } | null;
    sejour: { id: number; statut: 'en_cours' | 'cloture' } | null;
};

const STATUT_LABELS: Record<Statut, string> = {
    en_attente: 'En attente',
    validee: 'Validée',
    annulee: 'Annulée',
    terminee: 'Terminée',
};

const STATUT_VARIANTS: Record<Statut, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    en_attente: 'secondary',
    validee: 'default',
    annulee: 'destructive',
    terminee: 'outline',
};

function fmt(d: string): string {
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ReservationsIndex({ reservations }: { reservations: ReservationRow[] }) {
    const [processing, setProcessing] = useState(false);
    const [details, setDetails] = useState<ReservationRow | null>(null);
    const [checkinTarget, setCheckinTarget] = useState<ReservationRow | null>(null);

    function updateStatut(reservation: ReservationRow, statut: 'validee' | 'annulee') {
        setProcessing(true);
        router.patch(
            ReservationController.updateStatut(reservation.id).url,
            { statut },
            { preserveScroll: true, onFinish: () => setProcessing(false), onSuccess: () => setDetails(null) },
        );
    }

    function destroy(reservation: ReservationRow) {
        if (!confirm(`Supprimer la réservation #${reservation.id} ?`)) return;
        router.delete(ReservationController.destroy(reservation.id).url, { preserveScroll: true });
    }

    function checkin(etatLieuxEntree: string) {
        if (!checkinTarget) return;
        setProcessing(true);
        router.post(
            SejourController.store().url,
            { reservation_id: checkinTarget.id, etat_lieux_entree: etatLieuxEntree },
            { preserveScroll: true, onFinish: () => setProcessing(false), onSuccess: () => setCheckinTarget(null) },
        );
    }

    const columns: ColumnDef<ReservationRow>[] = [
        {
            accessorKey: 'appartement',
            header: 'Appartement',
            cell: ({ row }) => row.original.appartement?.numero ?? '—',
        },
        {
            id: 'client',
            header: 'Client',
            accessorFn: (r) => `${r.client?.nom ?? ''} ${r.client?.prenom ?? ''}`,
        },
        {
            accessorKey: 'date_debut',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Arrivée <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => fmt(row.original.date_debut),
        },
        {
            accessorKey: 'date_fin',
            header: 'Départ',
            cell: ({ row }) => fmt(row.original.date_fin),
        },
        {
            accessorKey: 'statut',
            header: 'Statut',
            cell: ({ row }) => <Badge variant={STATUT_VARIANTS[row.original.statut]}>{STATUT_LABELS[row.original.statut]}</Badge>,
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const reservation = row.original;
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
                            <DropdownMenuItem onClick={() => setDetails(reservation)}>Voir détails</DropdownMenuItem>
                            {reservation.statut === 'en_attente' && (
                                <>
                                    <DropdownMenuItem onClick={() => updateStatut(reservation, 'validee')} disabled={processing}>
                                        Confirmer
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateStatut(reservation, 'annulee')} disabled={processing}>
                                        Annuler
                                    </DropdownMenuItem>
                                </>
                            )}
                            {reservation.statut === 'validee' && !reservation.sejour && (
                                <DropdownMenuItem onClick={() => setCheckinTarget(reservation)}>Effectuer le check-in</DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => destroy(reservation)}>
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
            <Head title="Réservations" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h1 className="text-2xl font-semibold">Réservations</h1>
                <DataTable
                    columns={columns}
                    data={reservations}
                    searchPlaceholder="Rechercher un client, un appartement..."
                    toolbar={<ExportDialog exportUrl={ReservationController.export().url} />}
                />
            </div>

            <Dialog open={details !== null} onOpenChange={(open) => !open && setDetails(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {details?.appartement?.numero} — {details?.client?.nom} {details?.client?.prenom}
                        </DialogTitle>
                    </DialogHeader>
                    {details && (
                        <div className="space-y-3 text-sm">
                            <p>
                                <span className="text-muted-foreground">Dates : </span>
                                {fmt(details.date_debut)} → {fmt(details.date_fin)}
                            </p>
                            <p>
                                <span className="text-muted-foreground">Statut : </span>
                                {STATUT_LABELS[details.statut]}
                            </p>
                            <p>
                                <span className="text-muted-foreground">Séjour : </span>
                                {details.sejour ? (details.sejour.statut === 'en_cours' ? 'Check-in effectué' : 'Clôturé') : 'Pas encore de check-in'}
                            </p>
                            {details.statut === 'en_attente' && (
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => updateStatut(details, 'annulee')} disabled={processing}>
                                        <XCircle className="text-red-600" /> Annuler
                                    </Button>
                                    <Button onClick={() => updateStatut(details, 'validee')} disabled={processing}>
                                        <CheckCircle2 /> Confirmer
                                    </Button>
                                </DialogFooter>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <EtatLieuxDialog
                open={checkinTarget !== null}
                onOpenChange={(open) => !open && setCheckinTarget(null)}
                title={`Check-in — ${checkinTarget?.appartement?.numero ?? ''}`}
                submitLabel="Valider le check-in"
                processing={processing}
                equipements={checkinTarget?.appartement?.equipements ?? []}
                onSubmit={({ etatLieux }) => checkin(etatLieux)}
            />
        </>
    );
}

ReservationsIndex.layout = {
    breadcrumbs: [{ title: 'Réservations', href: ReservationController.index() }],
};
