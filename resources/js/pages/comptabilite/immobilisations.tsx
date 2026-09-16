import { Head, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import type { FormEvent } from 'react';
import { useState } from 'react';
import ComptabiliteController from '@/actions/App/Http/Controllers/ComptabiliteController';
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
import { fmtDate, fmtMontant } from './shared';
import type { ImmobilisationRow } from './shared';

const TOUS = '__tous__';

/**
 * Registre des immobilisations (extension Phase 06) — vue cumulative des lignes de
 * facture fournisseur `nature = 'immobilisation'` déjà validées. Aucune nouvelle table :
 * la saisie reste « Factures fournisseur », cet écran ne fait que les additionner dans le
 * temps.
 *
 * ÉCRAN EN LECTURE SEULE, comme « Entrées » : la nature d'une ligne se corrige depuis
 * l'écran Factures fournisseur, pas ici.
 */
export default function Immobilisations({
    lignes,
    total,
    appartements,
    filters,
}: {
    lignes: ImmobilisationRow[];
    total: number;
    appartements: { id: number; numero: string }[];
    filters: { appartement_id?: number | null; du?: string | null; au?: string | null };
}) {
    const [appartementId, setAppartementId] = useState(
        filters.appartement_id ? String(filters.appartement_id) : TOUS,
    );
    const [du, setDu] = useState(filters.du ?? '');
    const [au, setAu] = useState(filters.au ?? '');

    function filtrer(e: FormEvent) {
        e.preventDefault();
        router.get(
            ComptabiliteController.immobilisations().url,
            {
                appartement_id: appartementId === TOUS ? undefined : appartementId,
                du: du || undefined,
                au: au || undefined,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    const exportUrl =
        ComptabiliteController.exportImmobilisations().url +
        (appartementId !== TOUS ? `?appartement_id=${appartementId}` : '');

    const columns: ColumnDef<ImmobilisationRow>[] = [
        {
            id: 'date_facture',
            header: 'Acquise le',
            accessorFn: (l) => l.date_facture ?? '',
            cell: ({ row }) => <span className="text-sm">{fmtDate(row.original.date_facture)}</span>,
        },
        {
            id: 'designation',
            header: 'Désignation',
            accessorFn: (l) => l.designation,
            cell: ({ row }) => (
                <div className="space-y-0.5">
                    <p className="text-sm">{row.original.designation}</p>
                    <p className="text-xs text-muted-foreground">{row.original.fournisseur ?? '—'}</p>
                </div>
            ),
        },
        {
            id: 'appartement',
            header: 'Appartement',
            accessorFn: (l) => l.appartement,
            cell: ({ row }) => <span className="text-sm">{row.original.appartement}</span>,
        },
        {
            id: 'statut',
            header: 'Statut',
            accessorFn: (l) => l.statut,
            cell: ({ row }) => (
                <Badge variant={row.original.statut === 'Réformé' ? 'destructive' : 'secondary'}>
                    {row.original.statut}
                </Badge>
            ),
        },
        {
            id: 'garantie_fin',
            header: 'Garantie jusqu\'au',
            accessorFn: (l) => l.garantie_fin ?? '',
            cell: ({ row }) => <span className="text-xs">{fmtDate(row.original.garantie_fin)}</span>,
        },
        {
            id: 'montant',
            header: 'Montant',
            accessorFn: (l) => l.montant,
            cell: ({ row }) => (
                <span className="text-sm font-medium tabular-nums">{fmtMontant(row.original.montant)}</span>
            ),
        },
    ];

    return (
        <>
            <Head title="Registre des immobilisations" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold">Registre des immobilisations</h1>
                        <p className="text-sm text-muted-foreground">
                            {fmtMontant(total)} immobilisés sur {lignes.length} ligne{lignes.length > 1 ? 's' : ''}
                        </p>
                    </div>
                    <ExportDialog exportUrl={exportUrl} />
                </div>

                <form
                    onSubmit={filtrer}
                    className="grid grid-cols-2 gap-3 rounded-md border p-3 md:grid-cols-4 md:items-end"
                >
                    <div className="grid gap-1.5">
                        <Label htmlFor="f-appartement">Appartement</Label>
                        <Select value={appartementId} onValueChange={setAppartementId}>
                            <SelectTrigger id="f-appartement">
                                <SelectValue placeholder="Tous" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TOUS}>Tous</SelectItem>
                                {appartements.map((a) => (
                                    <SelectItem key={a.id} value={String(a.id)}>
                                        {a.numero}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="f-du">Du</Label>
                        <Input id="f-du" type="date" value={du} onChange={(e) => setDu(e.target.value)} />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="f-au">Au</Label>
                        <Input id="f-au" type="date" value={au} onChange={(e) => setAu(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit">Filtrer</Button>
                    </div>
                </form>

                <DataTable columns={columns} data={lignes} searchPlaceholder="Rechercher une immobilisation..." />

                <p className="text-xs text-muted-foreground">
                    Écran de consultation. La nature d'une ligne se corrige depuis Factures fournisseur.
                </p>
            </div>
        </>
    );
}

Immobilisations.layout = {
    breadcrumbs: [
        { title: 'Comptabilité', href: '/admin/comptabilite' },
        { title: 'Registre des immobilisations', href: ComptabiliteController.immobilisations() },
    ],
};
