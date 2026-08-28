import { Head, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import type { FormEvent } from 'react';
import MaintenanceController from '@/actions/App/Http/Controllers/MaintenanceController';
import { DataTable } from '@/components/data-table/data-table';
import { ExportDialog } from '@/components/data-table/export-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { InterventionDialog } from './intervention-dialog';
import {
    ETAPE_LABELS,
    ETAPES,
    EtapeBadge,
    MACRO_LABELS,
    PRIORITE_LABELS,
    PRIORITES,
    PrioriteBadge,
    SlaBadge,
    fmtDateHeure,
    fmtMontant,
    nomComplet,
} from './shared';
import type {
    Etape,
    InterventionRow,
    ParametresMaintenance,
    Priorite,
    Technicien,
} from './shared';

/**
 * Écran 2 du pôle — la vue exhaustive. Seul écran qui montre aussi les dossiers fermés,
 * seul écran exportable. Les filtres vivent côté serveur (l'URL est partageable et
 * l'export reprend exactement les mêmes critères) ; la recherche plein texte de la
 * DataTable reste, elle, côté client sur la page courante.
 */
type Filters = {
    etape?: Etape | null;
    priorite?: Priorite | null;
    sla?: 'depasse' | null;
};

const TOUS = '__tous__';

export default function MaintenanceInterventions({
    interventions,
    techniciens,
    parametres,
    filters,
}: {
    interventions: InterventionRow[];
    techniciens: Technicien[];
    parametres: ParametresMaintenance;
    filters: Filters;
}) {
    const [detailId, setDetailId] = useState<number | null>(null);
    const [etape, setEtape] = useState<string>(filters.etape ?? TOUS);
    const [priorite, setPriorite] = useState<string>(filters.priorite ?? TOUS);
    const [sla, setSla] = useState<string>(filters.sla ?? TOUS);

    // Relu dans la liste fraîche à chaque rendu : après une action, Inertia recharge les
    // props et la fiche ouverte doit afficher la nouvelle étape, pas une copie figée.
    const detail = interventions.find((i) => i.id === detailId) ?? null;

    const critereActifs = {
        etape: etape === TOUS ? undefined : etape,
        priorite: priorite === TOUS ? undefined : priorite,
        sla: sla === TOUS ? undefined : sla,
    };

    function appliquerFiltres(e: FormEvent) {
        e.preventDefault();
        router.get(MaintenanceController.interventions().url, critereActifs, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }

    function reinitialiser() {
        setEtape(TOUS);
        setPriorite(TOUS);
        setSla(TOUS);
        router.get(
            MaintenanceController.interventions().url,
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    const parametresExport = new URLSearchParams(
        Object.entries(critereActifs).filter(
            ([, valeur]) => valeur !== undefined,
        ) as [string, string][],
    ).toString();

    const columns: ColumnDef<InterventionRow>[] = [
        {
            id: 'appartement',
            header: 'Appartement',
            accessorFn: (i) => i.appartement?.numero ?? '—',
        },
        {
            id: 'equipement',
            header: 'Équipement',
            accessorFn: (i) => i.equipement?.nom ?? '—',
        },
        {
            accessorKey: 'description_panne',
            header: 'Panne',
            cell: ({ row }) => (
                <span className="line-clamp-2 max-w-xs">
                    {row.original.description_panne}
                </span>
            ),
        },
        {
            accessorKey: 'priorite',
            header: 'Priorité',
            cell: ({ row }) => (
                <PrioriteBadge priorite={row.original.priorite} />
            ),
        },
        {
            accessorKey: 'etape',
            header: 'Étape',
            cell: ({ row }) => <EtapeBadge etape={row.original.etape} />,
        },
        {
            id: 'macro',
            header: 'Statut',
            accessorFn: (i) => MACRO_LABELS[i.statut_macro],
            cell: ({ row }) => (
                <Badge variant="outline">
                    {MACRO_LABELS[row.original.statut_macro]}
                </Badge>
            ),
        },
        {
            id: 'technicien',
            header: 'Technicien',
            accessorFn: (i) => nomComplet(i.technicien),
        },
        {
            id: 'signalement',
            header: 'Signalée le',
            accessorFn: (i) => i.date_signalement ?? '',
            cell: ({ row }) => fmtDateHeure(row.original.date_signalement),
        },
        {
            id: 'sla',
            header: 'SLA',
            cell: ({ row }) => <SlaBadge intervention={row.original} />,
        },
        {
            id: 'cout',
            header: 'Coût',
            accessorFn: (i) => i.cout_total,
            cell: ({ row }) => fmtMontant(row.original.cout_total),
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDetailId(row.original.id)}
                    >
                        Détails
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title="Suivi des interventions" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h1 className="text-2xl font-semibold">
                        Suivi des interventions
                    </h1>
                    <ExportDialog
                        exportUrl={
                            parametresExport
                                ? `${MaintenanceController.exportMethod().url}?${parametresExport}`
                                : MaintenanceController.exportMethod().url
                        }
                    />
                </div>

                <form
                    onSubmit={appliquerFiltres}
                    className="grid grid-cols-2 gap-3 rounded-md border p-3 md:grid-cols-4 md:items-end"
                >
                    <div className="grid gap-1.5">
                        <Label htmlFor="filtre-etape">Étape</Label>
                        <Select value={etape} onValueChange={setEtape}>
                            <SelectTrigger id="filtre-etape">
                                <SelectValue placeholder="Toutes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TOUS}>Toutes</SelectItem>
                                {ETAPES.map((valeur) => (
                                    <SelectItem key={valeur} value={valeur}>
                                        {ETAPE_LABELS[valeur]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="filtre-priorite">Priorité</Label>
                        <Select value={priorite} onValueChange={setPriorite}>
                            <SelectTrigger id="filtre-priorite">
                                <SelectValue placeholder="Toutes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TOUS}>Toutes</SelectItem>
                                {PRIORITES.map((valeur) => (
                                    <SelectItem key={valeur} value={valeur}>
                                        {PRIORITE_LABELS[valeur]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="filtre-sla">SLA</Label>
                        <Select value={sla} onValueChange={setSla}>
                            <SelectTrigger id="filtre-sla">
                                <SelectValue placeholder="Tous" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TOUS}>Tous</SelectItem>
                                <SelectItem value="depasse">
                                    Dépassé uniquement
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-2">
                        <Button type="submit">Filtrer</Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={reinitialiser}
                        >
                            Réinitialiser
                        </Button>
                    </div>
                </form>

                <DataTable
                    columns={columns}
                    data={interventions}
                    searchPlaceholder="Rechercher une panne, un équipement..."
                />
            </div>

            <InterventionDialog
                intervention={detail}
                techniciens={techniciens}
                parametres={parametres}
                onClose={() => setDetailId(null)}
            />
        </>
    );
}

MaintenanceInterventions.layout = {
    breadcrumbs: [
        { title: 'Maintenance', href: MaintenanceController.dashboard() },
        {
            title: 'Suivi des interventions',
            href: MaintenanceController.interventions(),
        },
    ],
};
