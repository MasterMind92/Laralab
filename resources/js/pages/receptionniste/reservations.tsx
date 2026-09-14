import { Head, router } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, CheckCircle2, Eye, LogIn, MoreHorizontal, Trash2, XCircle } from 'lucide-react';
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
    paiement_initial: { montant: string; mode_paiement: string; date_paiement: string } | null;
};

const MODE_PAIEMENT_LABELS: Record<string, string> = {
    cb: 'carte bancaire',
    especes: 'espèces',
    virement: 'virement',
    mobile_money: 'mobile money',
    paypal: 'PayPal',
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
            id: 'paiement_initial',
            header: 'Payé à la réservation',
            cell: ({ row }) => {
                const p = row.original.paiement_initial;
                if (!p) return <span className="text-muted-foreground">—</span>;
                return `${Number(p.montant).toLocaleString('fr-FR')} FCFA (${MODE_PAIEMENT_LABELS[p.mode_paiement] ?? p.mode_paiement})`;
            },
        },
        {
            id: 'actions',
            header: 'Actions',
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
                            <DropdownMenuItem onClick={() => setDetails(reservation)}><Eye /> Voir détails</DropdownMenuItem>
                            {reservation.statut === 'en_attente' && (
                                <>
                                    <DropdownMenuItem onClick={() => updateStatut(reservation, 'validee')} disabled={processing}>
                                        <CheckCircle2 /> Confirmer
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateStatut(reservation, 'annulee')} disabled={processing}>
                                        <XCircle className="text-red-600" /> Annuler
                                    </DropdownMenuItem>
                                </>
                            )}
                            {reservation.statut === 'validee' && !reservation.sejour && (
                                <DropdownMenuItem onClick={() => setCheckinTarget(reservation)}><LogIn /> Effectuer le check-in</DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => destroy(reservation)}>
                                <Trash2 className="text-red-500" />
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
                            <p>
                                <span className="text-muted-foreground">Payé à la réservation : </span>
                                {details.paiement_initial
                                    ? `${Number(details.paiement_initial.montant).toLocaleString('fr-FR')} FCFA (${MODE_PAIEMENT_LABELS[details.paiement_initial.mode_paiement] ?? details.paiement_initial.mode_paiement})`
                                    : '—'}
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
