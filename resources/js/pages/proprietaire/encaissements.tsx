import { Head } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import ProprietaireEncaissementController from '@/actions/App/Http/Controllers/Proprietaire/EncaissementController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table/data-table';
import { ExportDialog } from '@/components/data-table/export-dialog';

type PaiementResume = {
    id: number;
    montant: string;
    mode_paiement: string;
    date_paiement: string;
    facture: {
        sejour: {
            reservation: {
                appartement: { id: number; numero: string; titre: string | null } | null;
                client: { id: number; nom: string; prenom: string } | null;
            } | null;
        } | null;
    } | null;
};

const MODE_LABELS: Record<string, string> = { cb: 'Carte bancaire', especes: 'Espèces', virement: 'Virement', mobile_money: 'Mobile Money' };

function formatFcfa(n: number): string {
    return n.toLocaleString('fr-FR');
}

export default function Encaissements({ paiements }: { paiements: PaiementResume[] }) {
    const columns: ColumnDef<PaiementResume>[] = [
        {
            id: 'appartement',
            header: 'Appartement',
            cell: ({ row }) => {
                const apt = row.original.facture?.sejour?.reservation?.appartement;
                return apt ? (apt.titre ?? apt.numero) : '—';
            },
        },
        {
            id: 'client',
            header: 'Client',
            cell: ({ row }) => {
                const client = row.original.facture?.sejour?.reservation?.client;
                return client ? `${client.nom} ${client.prenom}` : '—';
            },
        },
        {
            id: 'montant',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Montant <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => `${formatFcfa(Number(row.original.montant))} FCFA`,
        },
        {
            accessorKey: 'mode_paiement',
            header: 'Mode',
            cell: ({ row }) => <Badge variant="outline">{MODE_LABELS[row.original.mode_paiement] ?? row.original.mode_paiement}</Badge>,
        },
        {
            id: 'date',
            header: 'Date',
            cell: ({ row }) => new Date(row.original.date_paiement).toLocaleDateString('fr-FR'),
        },
    ];

    return (
        <>
            <Head title="Encaissements" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Paiements encaissés</h1>
                    <ExportDialog exportUrl={ProprietaireEncaissementController.export().url} />
                </div>

                <DataTable columns={columns} data={paiements} searchPlaceholder="Rechercher un encaissement..." />
            </div>
        </>
    );
}
