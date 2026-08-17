import { Head } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-table/data-table';

type ModePaiement = 'cb' | 'especes' | 'virement' | 'mobile_money' | 'paypal';

type PaiementReservationRow = {
    id: number;
    montant: string;
    mode_paiement: ModePaiement;
    date_paiement: string;
    rattache: boolean;
    reservation: {
        id: number;
        appartement: string | null;
        client: string | null;
        date_debut: string;
        date_fin: string;
    } | null;
};

const MODE_LABELS: Record<ModePaiement, string> = {
    cb: 'Carte bancaire',
    especes: 'Espèces',
    virement: 'Virement',
    mobile_money: 'Mobile Money',
    paypal: 'PayPal',
};

function montant(n: string | number): string {
    return `${Number(n).toLocaleString('fr-FR')} FCFA`;
}

function formatDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-FR');
}

const columns: ColumnDef<PaiementReservationRow>[] = [
    {
        id: 'client',
        header: 'Client',
        accessorFn: (p) => p.reservation?.client ?? '—',
    },
    {
        id: 'appartement',
        header: 'Appartement',
        accessorFn: (p) => p.reservation?.appartement ?? '—',
    },
    {
        id: 'sejour',
        header: 'Séjour',
        cell: ({ row }) => {
            const r = row.original.reservation;
            return r ? `${formatDate(r.date_debut)} → ${formatDate(r.date_fin)}` : '—';
        },
    },
    {
        id: 'montant',
        header: 'Montant perçu',
        cell: ({ row }) => montant(row.original.montant),
    },
    {
        id: 'mode_paiement',
        header: 'Mode',
        cell: ({ row }) => MODE_LABELS[row.original.mode_paiement],
    },
    {
        id: 'date_paiement',
        header: 'Perçu le',
        cell: ({ row }) => formatDate(row.original.date_paiement),
    },
    {
        id: 'rattache',
        header: 'Statut',
        cell: ({ row }) => (
            <Badge variant={row.original.rattache ? 'default' : 'secondary'}>
                {row.original.rattache ? 'Rattaché à la facture' : "En attente de clôture du séjour"}
            </Badge>
        ),
    },
];

export default function PaiementsReservationsIndex({ paiements }: { paiements: PaiementReservationRow[] }) {
    return (
        <>
            <Head title="Avances reçues" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Avances reçues à la réservation</h1>
                    <p className="text-muted-foreground text-sm">
                        Acomptes ou paiements intégraux simulés sur le portail client — déjà considérés perçus, sans
                        action requise ici. Une fois le séjour clôturé et le devis généré, la ligne est
                        automatiquement rattachée à la facture correspondante.
                    </p>
                </div>
                <DataTable columns={columns} data={paiements} searchPlaceholder="Rechercher un client, un appartement..." />
            </div>
        </>
    );
}
