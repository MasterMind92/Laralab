import { Head, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import type { FormEvent } from 'react';
import { useState } from 'react';
import ComptabiliteController from '@/actions/App/Http/Controllers/ComptabiliteController';
import { DataTable } from '@/components/data-table/data-table';
import { ExportDialog } from '@/components/data-table/export-dialog';
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
import { EtatAvanceBadge, fmtDate, fmtMontant } from './shared';
import type { AvanceRow } from './shared';

const TOUS = '__tous__';

/**
 * Avances de réservation (extension Phase 06) — isole les acomptes pris au checkout
 * portail (`Paiement.reservation_id` non nul, avant qu'une Facture existe), aujourd'hui
 * noyés dans « Entrées ». Même source, même règle de non double-comptage.
 *
 * ÉCRAN EN LECTURE SEULE : l'acompte vient du portail client, il ne se saisit pas ici.
 */
export default function Avances({
    avances,
    total,
    appartements,
    filters,
}: {
    avances: AvanceRow[];
    total: number;
    appartements: { id: number; numero: string }[];
    filters: { appartement_id?: number | null; client?: string | null; du?: string | null; au?: string | null };
}) {
    const [appartementId, setAppartementId] = useState(
        filters.appartement_id ? String(filters.appartement_id) : TOUS,
    );
    const [client, setClient] = useState(filters.client ?? '');
    const [du, setDu] = useState(filters.du ?? '');
    const [au, setAu] = useState(filters.au ?? '');

    function filtrer(e: FormEvent) {
        e.preventDefault();
        router.get(
            ComptabiliteController.avances().url,
            {
                appartement_id: appartementId === TOUS ? undefined : appartementId,
                client: client || undefined,
                du: du || undefined,
                au: au || undefined,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    const exportUrl =
        ComptabiliteController.exportAvances().url +
        (appartementId !== TOUS ? `?appartement_id=${appartementId}` : '');

    const enAttente = avances.filter((a) => a.etat === 'en_attente').length;

    const columns: ColumnDef<AvanceRow>[] = [
        {
            id: 'date',
            header: 'Perçue le',
            accessorFn: (a) => a.date_paiement ?? '',
            cell: ({ row }) => <span className="text-sm">{fmtDate(row.original.date_paiement)}</span>,
        },
        {
            id: 'client',
            header: 'Client',
            accessorFn: (a) => a.client ?? '',
            cell: ({ row }) => (
                <div className="space-y-0.5">
                    <p className="text-sm">{row.original.client ?? '—'}</p>
                    {row.original.appartement && (
                        <p className="text-xs text-muted-foreground">Appartement {row.original.appartement}</p>
                    )}
                </div>
            ),
        },
        {
            id: 'etat',
            header: 'État',
            accessorFn: (a) => a.etat,
            cell: ({ row }) => <EtatAvanceBadge etat={row.original.etat} />,
        },
        {
            id: 'facture',
            header: 'Facture',
            accessorFn: (a) => a.numero_facture ?? '',
            cell: ({ row }) => (
                <span className="font-mono text-xs text-muted-foreground">{row.original.numero_facture ?? '—'}</span>
            ),
        },
        {
            id: 'montant',
            header: 'Montant',
            accessorFn: (a) => a.montant,
            cell: ({ row }) => (
                <span className="text-sm font-medium tabular-nums">{fmtMontant(row.original.montant)}</span>
            ),
        },
    ];

    return (
        <>
            <Head title="Avances de réservation" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold">Avances de réservation</h1>
                        <p className="text-sm text-muted-foreground">
                            {fmtMontant(total)} sur {avances.length} avance{avances.length > 1 ? 's' : ''}
                            {enAttente > 0 && ` · ${enAttente} en attente de facturation`}
                        </p>
                    </div>
                    <ExportDialog exportUrl={exportUrl} />
                </div>

                <form
                    onSubmit={filtrer}
                    className="grid grid-cols-2 gap-3 rounded-md border p-3 md:grid-cols-5 md:items-end"
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
                        <Label htmlFor="f-client">Client</Label>
                        <Input
                            id="f-client"
                            placeholder="Nom ou prénom"
                            value={client}
                            onChange={(e) => setClient(e.target.value)}
                        />
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

                <DataTable columns={columns} data={avances} searchPlaceholder="Rechercher une avance..." />

                <p className="text-xs text-muted-foreground">
                    Écran de consultation. L'avance se saisit au checkout du portail client.
                </p>
            </div>
        </>
    );
}

Avances.layout = {
    breadcrumbs: [
        { title: 'Comptabilité', href: '/admin/comptabilite' },
        { title: 'Avances de réservation', href: ComptabiliteController.avances() },
    ],
};
