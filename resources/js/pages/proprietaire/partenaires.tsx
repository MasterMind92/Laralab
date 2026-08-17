import { Head } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/data-table';

type PartenaireResume = {
    id: number;
    nom: string;
    contact: string | null;
    type_service: string | null;
};

export default function Partenaires({ partenaires }: { partenaires: PartenaireResume[] }) {
    const columns: ColumnDef<PartenaireResume>[] = [
        { accessorKey: 'nom', header: 'Nom' },
        { accessorKey: 'contact', header: 'Contact', cell: ({ row }) => row.original.contact ?? '—' },
        { accessorKey: 'type_service', header: 'Type de service', cell: ({ row }) => row.original.type_service ?? '—' },
    ];

    return (
        <>
            <Head title="Partenaires" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Partenaires</h1>
                    <p className="text-sm text-muted-foreground">Catalogue des partenaires et services complémentaires proposés — consultation uniquement.</p>
                </div>
                <DataTable columns={columns} data={partenaires} searchPlaceholder="Rechercher un partenaire..." />
            </div>
        </>
    );
}
