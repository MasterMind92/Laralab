import { Head } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/data-table';
import { Badge } from '@/components/ui/badge';

type LigneDevis = { designation: string; quantite: number; montant: number };

type DevisResume = {
    id: number;
    statut: 'brouillon' | 'validee' | 'payee' | 'annulee';
    montant: number;
    date_validation: string | null;
    date_paiement: string | null;
    fournisseur: string | null;
    commande: string | null;
    lignes: LigneDevis[];
};

const STATUT_LABELS: Record<DevisResume['statut'], string> = {
    brouillon: 'Brouillon',
    validee: 'Validé',
    payee: 'Payé',
    annulee: 'Annulé',
};

function formatFcfa(n: number): string {
    return `${n.toLocaleString('fr-FR')} FCFA`;
}

/**
 * Lecture seule (extension Phase 06) : ce que la plateforme facture pour l'équipement
 * acheté pour le compte du Propriétaire. Le règlement se fait côté Comptabilité, pas ici.
 */
export default function DevisEquipement({ devis }: { devis: DevisResume[] }) {
    const columns: ColumnDef<DevisResume>[] = [
        {
            id: 'reference',
            header: 'Commande',
            cell: ({ row }) => (
                <div className="space-y-0.5">
                    <p className="font-mono text-sm">{row.original.commande ?? `Devis #${row.original.id}`}</p>
                    <p className="text-xs text-muted-foreground">{row.original.fournisseur ?? '—'}</p>
                </div>
            ),
        },
        {
            id: 'lignes',
            header: 'Équipement',
            cell: ({ row }) => (
                <p className="text-sm text-muted-foreground">
                    {row.original.lignes.map((l) => l.designation).join(', ') || '—'}
                </p>
            ),
        },
        {
            accessorKey: 'statut',
            header: 'Statut',
            cell: ({ row }) => <Badge variant="outline">{STATUT_LABELS[row.original.statut]}</Badge>,
        },
        {
            id: 'montant',
            header: 'Montant',
            cell: ({ row }) => formatFcfa(row.original.montant),
        },
        {
            id: 'date',
            header: 'Date',
            cell: ({ row }) =>
                row.original.date_paiement
                    ? new Date(row.original.date_paiement).toLocaleDateString('fr-FR')
                    : row.original.date_validation
                      ? new Date(row.original.date_validation).toLocaleDateString('fr-FR')
                      : '—',
        },
    ];

    return (
        <>
            <Head title="Devis équipement" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h1 className="text-2xl font-semibold">Devis équipement</h1>
                <DataTable columns={columns} data={devis} searchPlaceholder="Rechercher un devis..." />
            </div>
        </>
    );
}
