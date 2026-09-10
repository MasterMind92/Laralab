import { Head, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import type { FormEvent } from 'react';
import { useState } from 'react';
import ComptabiliteController from '@/actions/App/Http/Controllers/ComptabiliteController';
import { DataTable } from '@/components/data-table/data-table';
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
import {
    fmtDate,
    fmtMontant,
    MODE_ENCAISSEMENT_LABELS,
    OrigineEntreeBadge,
} from './shared';
import type { EntreeRow, ModeEncaissement } from './shared';

/**
 * Entrées — le livre des encaissements (Phase 06, étape B-bis).
 *
 * Tout ce qui entre en caisse, en un seul endroit. L'argent qui rentre se lisait jusqu'ici
 * à DEUX endroits : « Consultation Devis » pour les règlements de facture, « Avances
 * reçues » pour les acomptes du portail. Deux écrans pour une seule question.
 *
 * Pas de double comptage : un acompte perçu à la réservation puis rattaché à sa facture
 * reste UNE seule ligne de paiement — la génération du devis renseigne `facture_id` sur la
 * ligne existante au lieu d'en créer une seconde. Le badge « rattachée » le signale.
 *
 * ÉCRAN EN LECTURE SEULE, délibérément. L'encaissement se saisit depuis la facture, et
 * l'avance vient du portail client. Ouvrir une seconde voie de saisie ici donnerait deux
 * chemins pour un même geste, et deux occasions de se tromper.
 */
const TOUS = '__tous__';

export default function Entrees({
    entrees,
    total,
    par_mode: parMode,
    filters,
}: {
    entrees: EntreeRow[];
    total: number;
    par_mode: { mode: string; total: number }[];
    filters: {
        mode_paiement?: ModeEncaissement | null;
        du?: string | null;
        au?: string | null;
    };
}) {
    const [mode, setMode] = useState<string>(filters.mode_paiement ?? TOUS);
    const [du, setDu] = useState(filters.du ?? '');
    const [au, setAu] = useState(filters.au ?? '');

    function filtrer(e: FormEvent) {
        e.preventDefault();
        router.get(
            ComptabiliteController.entrees().url,
            {
                mode_paiement: mode === TOUS ? undefined : mode,
                du: du || undefined,
                au: au || undefined,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    const avances = entrees.filter((e) => e.origine === 'avance');

    const columns: ColumnDef<EntreeRow>[] = [
        {
            id: 'date',
            header: 'Encaissée le',
            accessorFn: (e) => e.date_paiement ?? '',
            cell: ({ row }) => (
                <span className="text-sm">
                    {fmtDate(row.original.date_paiement)}
                </span>
            ),
        },
        {
            id: 'client',
            header: 'Client',
            accessorFn: (e) => e.client ?? '',
            cell: ({ row }) => (
                <div className="space-y-0.5">
                    <p className="text-sm">{row.original.client ?? '—'}</p>
                    {row.original.appartement && (
                        <p className="text-xs text-muted-foreground">
                            Appartement {row.original.appartement}
                        </p>
                    )}
                </div>
            ),
        },
        {
            id: 'origine',
            header: 'Origine',
            accessorFn: (e) => e.origine,
            cell: ({ row }) => (
                <div className="flex flex-wrap items-center gap-1.5">
                    <OrigineEntreeBadge origine={row.original.origine} />
                    {row.original.rattachee && (
                        <Badge variant="outline">Rattachée</Badge>
                    )}
                </div>
            ),
        },
        {
            id: 'facture',
            header: 'Facture',
            accessorFn: (e) => e.numero_facture ?? '',
            cell: ({ row }) => (
                <span className="font-mono text-xs text-muted-foreground">
                    {row.original.numero_facture ?? '—'}
                </span>
            ),
        },
        {
            id: 'mode',
            header: 'Mode',
            accessorFn: (e) => MODE_ENCAISSEMENT_LABELS[e.mode_paiement],
            cell: ({ row }) => (
                <span className="text-xs">
                    {MODE_ENCAISSEMENT_LABELS[row.original.mode_paiement] ??
                        row.original.mode_paiement}
                </span>
            ),
        },
        {
            id: 'montant',
            header: 'Montant',
            accessorFn: (e) => e.montant,
            cell: ({ row }) => (
                <span className="text-sm font-medium tabular-nums">
                    {fmtMontant(row.original.montant)}
                </span>
            ),
        },
    ];

    return (
        <>
            <Head title="Entrées" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Entrées</h1>
                    <p className="text-sm text-muted-foreground">
                        {fmtMontant(total)} encaissés sur {entrees.length}{' '}
                        mouvement{entrees.length > 1 ? 's' : ''}
                        {avances.length > 0 &&
                            ` · dont ${avances.length} avance${avances.length > 1 ? 's' : ''} à la réservation`}
                    </p>
                </div>

                <form
                    onSubmit={filtrer}
                    className="grid grid-cols-2 gap-3 rounded-md border p-3 md:grid-cols-4 md:items-end"
                >
                    <div className="grid gap-1.5">
                        <Label htmlFor="f-mode">Mode</Label>
                        <Select value={mode} onValueChange={setMode}>
                            <SelectTrigger id="f-mode">
                                <SelectValue placeholder="Tous" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TOUS}>Tous</SelectItem>
                                {Object.entries(MODE_ENCAISSEMENT_LABELS).map(
                                    ([cle, libelle]) => (
                                        <SelectItem key={cle} value={cle}>
                                            {libelle}
                                        </SelectItem>
                                    ),
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="f-du">Du</Label>
                        <Input
                            id="f-du"
                            type="date"
                            value={du}
                            onChange={(e) => setDu(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="f-au">Au</Label>
                        <Input
                            id="f-au"
                            type="date"
                            value={au}
                            onChange={(e) => setAu(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit">Filtrer</Button>
                    </div>
                </form>

                {parMode.length > 0 && (
                    <section className="overflow-hidden rounded-md border">
                        <header className="border-b bg-muted/40 px-3 py-2">
                            <h2 className="text-sm font-semibold">
                                Répartition par mode
                            </h2>
                        </header>
                        <ul className="divide-y">
                            {parMode.map((m) => (
                                <li
                                    key={m.mode}
                                    className="flex items-center gap-3 px-3 py-2"
                                >
                                    <span className="w-40 shrink-0 text-sm">
                                        {MODE_ENCAISSEMENT_LABELS[
                                            m.mode as ModeEncaissement
                                        ] ?? m.mode}
                                    </span>
                                    {/* Barre proportionnelle : la répartition se lit d'un
                                        coup d'oeil sans devenir un graphique — ceux-ci
                                        sont le périmètre de la Phase 07. */}
                                    <span
                                        className="h-2 rounded-full bg-primary/70"
                                        style={{
                                            width: `${Math.round((m.total / total) * 100)}%`,
                                            minWidth: '4px',
                                        }}
                                        aria-hidden
                                    />
                                    <span className="ml-auto text-sm tabular-nums">
                                        {fmtMontant(m.total)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <DataTable
                    columns={columns}
                    data={entrees}
                    searchPlaceholder="Rechercher un encaissement..."
                />

                <p className="text-xs text-muted-foreground">
                    Écran de consultation. Un encaissement se saisit depuis la
                    facture concernée ; les avances viennent du portail client.
                </p>
            </div>
        </>
    );
}

Entrees.layout = {
    breadcrumbs: [
        { title: 'Comptabilité', href: '/admin/comptabilite' },
        { title: 'Entrées', href: ComptabiliteController.entrees() },
    ],
};
