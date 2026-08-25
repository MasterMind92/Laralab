import { Head } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-table/data-table';

type InterventionResume = {
    id: number;
    etape: 'signalee' | 'planifiee' | 'technicien_affecte' | 'en_cours' | 'reparee' | 'controlee' | 'cloturee' | 'reformee';
    description_panne: string | null;
    date_signalement: string;
};

type EquipementResume = {
    id: number;
    nom: string;
    type: string | null;
    statut: 'stock' | 'affecte' | 'en_panne' | 'reforme';
    appartement: { id: number; numero: string; titre: string | null } | null;
    interventions: InterventionResume[];
};

const STATUT_LABELS: Record<string, string> = { stock: 'En stock', affecte: 'Affecté', en_panne: 'En panne', reforme: 'Réformé' };
const STATUT_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive'> = {
    stock: 'secondary',
    affecte: 'default',
    en_panne: 'destructive',
    reforme: 'destructive',
};

export default function Equipements({ equipements }: { equipements: EquipementResume[] }) {
    const columns: ColumnDef<EquipementResume>[] = [
        { accessorKey: 'nom', header: 'Équipement' },
        { accessorKey: 'type', header: 'Type', cell: ({ row }) => row.original.type ?? '—' },
        {
            id: 'appartement',
            header: 'Appartement',
            cell: ({ row }) => row.original.appartement ? (row.original.appartement.titre ?? row.original.appartement.numero) : '—',
        },
        {
            accessorKey: 'statut',
            header: 'Statut',
            cell: ({ row }) => <Badge variant={STATUT_VARIANTS[row.original.statut]}>{STATUT_LABELS[row.original.statut]}</Badge>,
        },
        {
            id: 'derniere_intervention',
            header: 'Dernière intervention',
            cell: ({ row }) => {
                const intervention = row.original.interventions[0];
                if (!intervention) return <span className="text-muted-foreground text-xs">Aucune</span>;
                return (
                    <span className="text-sm">
                        {new Date(intervention.date_signalement).toLocaleDateString('fr-FR')}
                        {intervention.description_panne && ` — ${intervention.description_panne}`}
                    </span>
                );
            },
        },
    ];

    return (
        <>
            <Head title="État des équipements" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h1 className="text-2xl font-semibold">État des équipements</h1>
                <DataTable columns={columns} data={equipements} searchPlaceholder="Rechercher un équipement..." />
            </div>
        </>
    );
}
