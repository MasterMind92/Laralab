import { Head, router, useForm } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import MaintenanceController from '@/actions/App/Http/Controllers/MaintenanceController';
import ParcEquipementController from '@/actions/App/Http/Controllers/ParcEquipementController';
import { DataTable } from '@/components/data-table/data-table';
import { ExportDialog } from '@/components/data-table/export-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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

/**
 * Écran 4 du pôle — le parc (Phase 05, R7). Garantie, contrat de maintenance et numéro
 * de série portent sur l'ÉQUIPEMENT et non sur une panne : ils ont donc leur propre
 * écran, pas un onglet de plus dans le suivi des interventions.
 *
 * Le tableau répond à trois questions opérationnelles : qu'est-ce qui est encore couvert,
 * qu'est-ce qui coûte cher à maintenir, et qu'est-ce qui est déjà sorti du parc.
 */
type StatutEquipement = 'stock' | 'affecte' | 'en_panne' | 'reforme';

type EquipementParc = {
    id: number;
    nom: string;
    type: string | null;
    statut: StatutEquipement;
    numero_serie: string | null;
    date_achat: string | null;
    garantie_fin: string | null;
    sous_garantie: boolean;
    contrat_actif: boolean;
    contrat_maintenance: boolean;
    contrat_reference: string | null;
    contrat_echeance: string | null;
    date_reforme: string | null;
    interventions_count: number;
    cout_maintenance: number;
    appartement: { id: number; numero: string; titre: string | null } | null;
};

type Filters = {
    appartement_id?: string | number | null;
    statut?: StatutEquipement | null;
    couverture?: 'garantie' | 'contrat' | 'aucune' | null;
};

const STATUT_LABELS: Record<StatutEquipement, string> = {
    stock: 'En stock',
    affecte: 'Affecté',
    en_panne: 'En panne',
    reforme: 'Réformé',
};

const STATUT_VARIANTS: Record<
    StatutEquipement,
    'default' | 'secondary' | 'destructive' | 'outline'
> = {
    stock: 'secondary',
    affecte: 'default',
    en_panne: 'destructive',
    reforme: 'outline',
};

const TOUS = '__tous__';

export default function MaintenanceParc({
    equipements,
    appartements,
    filters,
}: {
    equipements: EquipementParc[];
    appartements: { id: number; numero: string }[];
    filters: Filters;
}) {
    const [edition, setEdition] = useState<EquipementParc | null>(null);
    const [appartementId, setAppartementId] = useState(
        filters.appartement_id ? String(filters.appartement_id) : TOUS,
    );
    const [statut, setStatut] = useState<string>(filters.statut ?? TOUS);
    const [couverture, setCouverture] = useState<string>(
        filters.couverture ?? TOUS,
    );

    const form = useForm({
        numero_serie: '',
        garantie_fin: '',
        contrat_maintenance: false,
        contrat_reference: '',
        contrat_echeance: '',
    });

    function ouvrirEdition(equipement: EquipementParc) {
        form.setData({
            numero_serie: equipement.numero_serie ?? '',
            garantie_fin: equipement.garantie_fin ?? '',
            contrat_maintenance: equipement.contrat_maintenance,
            contrat_reference: equipement.contrat_reference ?? '',
            contrat_echeance: equipement.contrat_echeance ?? '',
        });
        setEdition(equipement);
    }

    function enregistrer(e: FormEvent) {
        e.preventDefault();

        if (!edition) {
            return;
        }

        form.transform((data) => ({
            ...data,
            // Les dates vides doivent partir en null : la règle `date` rejetterait ''.
            garantie_fin: data.garantie_fin || null,
            contrat_echeance: data.contrat_echeance || null,
            contrat_reference: data.contrat_reference || null,
            numero_serie: data.numero_serie || null,
        }));
        form.patch(ParcEquipementController.update(edition.id).url, {
            preserveScroll: true,
            onSuccess: () => setEdition(null),
        });
    }

    const criteres = {
        appartement_id: appartementId === TOUS ? undefined : appartementId,
        statut: statut === TOUS ? undefined : statut,
        couverture: couverture === TOUS ? undefined : couverture,
    };

    function filtrer(e: FormEvent) {
        e.preventDefault();
        router.get(ParcEquipementController.index().url, criteres, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }

    function reinitialiser() {
        setAppartementId(TOUS);
        setStatut(TOUS);
        setCouverture(TOUS);
        router.get(
            ParcEquipementController.index().url,
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    const columns: ColumnDef<EquipementParc>[] = [
        {
            id: 'appartement',
            header: 'Appartement',
            accessorFn: (e) => e.appartement?.numero ?? '—',
        },
        { accessorKey: 'nom', header: 'Équipement' },
        {
            accessorKey: 'numero_serie',
            header: 'N° de série',
            cell: ({ row }) => (
                <span className="font-mono text-xs">
                    {row.original.numero_serie ?? '—'}
                </span>
            ),
        },
        {
            accessorKey: 'statut',
            header: 'Statut',
            cell: ({ row }) => (
                <Badge variant={STATUT_VARIANTS[row.original.statut]}>
                    {STATUT_LABELS[row.original.statut]}
                </Badge>
            ),
        },
        {
            id: 'garantie',
            header: 'Garantie',
            accessorFn: (e) => e.garantie_fin ?? '',
            cell: ({ row }) => {
                const e = row.original;

                if (!e.garantie_fin) {
                    return (
                        <span className="text-xs text-muted-foreground">—</span>
                    );
                }

                return e.sous_garantie ? (
                    <Badge variant="default">
                        Jusqu'au {fmtDate(e.garantie_fin)}
                    </Badge>
                ) : (
                    <span className="text-xs text-muted-foreground">
                        Expirée le {fmtDate(e.garantie_fin)}
                    </span>
                );
            },
        },
        {
            id: 'contrat',
            header: 'Contrat',
            accessorFn: (e) => e.contrat_reference ?? '',
            cell: ({ row }) => {
                const e = row.original;

                if (!e.contrat_maintenance) {
                    return (
                        <span className="text-xs text-muted-foreground">—</span>
                    );
                }

                return (
                    <div className="space-y-0.5">
                        <Badge
                            variant={e.contrat_actif ? 'default' : 'outline'}
                        >
                            {e.contrat_actif ? 'Actif' : 'Échu'}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                            {e.contrat_reference ?? 'sans référence'}
                        </p>
                    </div>
                );
            },
        },
        {
            id: 'interventions',
            header: 'Pannes',
            accessorFn: (e) => e.interventions_count,
            cell: ({ row }) => (
                <span className="tabular-nums">
                    {row.original.interventions_count}
                </span>
            ),
        },
        {
            id: 'cout',
            header: 'Coût cumulé',
            accessorFn: (e) => e.cout_maintenance,
            cell: ({ row }) => (
                <span className="tabular-nums">
                    {fmtMontant(row.original.cout_maintenance)}
                </span>
            ),
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => ouvrirEdition(row.original)}
                    >
                        <Pencil /> Modifier
                    </Button>
                </div>
            ),
        },
    ];

    const sousGarantie = equipements.filter((e) => e.sous_garantie).length;
    const sousContrat = equipements.filter((e) => e.contrat_actif).length;
    const reformes = equipements.filter((e) => e.statut === 'reforme').length;

    return (
        <>
            <Head title="Parc équipements" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Parc équipements
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {equipements.length} équipements · {sousGarantie}{' '}
                            sous garantie · {sousContrat} sous contrat actif ·{' '}
                            {reformes} réformés
                        </p>
                    </div>
                    <ExportDialog
                        exportUrl={ParcEquipementController.exportMethod().url}
                    />
                </div>

                <form
                    onSubmit={filtrer}
                    className="grid grid-cols-2 gap-3 rounded-md border p-3 md:grid-cols-4 md:items-end"
                >
                    <div className="grid gap-1.5">
                        <Label htmlFor="f-appartement">Appartement</Label>
                        <Select
                            value={appartementId}
                            onValueChange={setAppartementId}
                        >
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
                        <Label htmlFor="f-statut">Statut</Label>
                        <Select value={statut} onValueChange={setStatut}>
                            <SelectTrigger id="f-statut">
                                <SelectValue placeholder="Tous" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TOUS}>Tous</SelectItem>
                                <SelectItem value="affecte">Affecté</SelectItem>
                                <SelectItem value="en_panne">
                                    En panne
                                </SelectItem>
                                <SelectItem value="reforme">Réformé</SelectItem>
                                <SelectItem value="stock">En stock</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="f-couverture">Couverture</Label>
                        <Select
                            value={couverture}
                            onValueChange={setCouverture}
                        >
                            <SelectTrigger id="f-couverture">
                                <SelectValue placeholder="Toutes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TOUS}>Toutes</SelectItem>
                                <SelectItem value="garantie">
                                    Sous garantie
                                </SelectItem>
                                <SelectItem value="contrat">
                                    Sous contrat
                                </SelectItem>
                                <SelectItem value="aucune">
                                    Sans couverture
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
                    data={equipements}
                    searchPlaceholder="Rechercher un équipement, un n° de série..."
                />
            </div>

            <Dialog
                open={edition !== null}
                onOpenChange={(open) => !open && setEdition(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {edition?.nom}
                            {edition?.appartement
                                ? ` — appartement ${edition.appartement.numero}`
                                : ''}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={enregistrer} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="numero_serie">
                                Numéro de série
                            </Label>
                            <Input
                                id="numero_serie"
                                value={form.data.numero_serie}
                                onChange={(e) =>
                                    form.setData('numero_serie', e.target.value)
                                }
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="garantie_fin">
                                Fin de garantie
                            </Label>
                            <Input
                                id="garantie_fin"
                                type="date"
                                value={form.data.garantie_fin}
                                onChange={(e) =>
                                    form.setData('garantie_fin', e.target.value)
                                }
                            />
                            {form.errors.garantie_fin && (
                                <p className="text-sm text-destructive">
                                    {form.errors.garantie_fin}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="contrat_maintenance"
                                checked={form.data.contrat_maintenance}
                                onCheckedChange={(v) =>
                                    form.setData(
                                        'contrat_maintenance',
                                        v === true,
                                    )
                                }
                            />
                            <Label htmlFor="contrat_maintenance">
                                Couvert par un contrat de maintenance
                            </Label>
                        </div>

                        {form.data.contrat_maintenance && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="contrat_reference">
                                        Référence
                                    </Label>
                                    <Input
                                        id="contrat_reference"
                                        value={form.data.contrat_reference}
                                        onChange={(e) =>
                                            form.setData(
                                                'contrat_reference',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="contrat_echeance">
                                        Échéance
                                    </Label>
                                    <Input
                                        id="contrat_echeance"
                                        type="date"
                                        value={form.data.contrat_echeance}
                                        onChange={(e) =>
                                            form.setData(
                                                'contrat_echeance',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        )}

                        {edition?.statut === 'reforme' && (
                            <p className="rounded-md border p-2 text-xs text-muted-foreground">
                                Équipement réformé le{' '}
                                {fmtDate(edition.date_reforme)} — sorti du parc,
                                il n'accepte plus de nouvelle panne.
                            </p>
                        )}

                        <DialogFooter>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing
                                    ? 'Enregistrement...'
                                    : 'Enregistrer'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

MaintenanceParc.layout = {
    breadcrumbs: [
        { title: 'Maintenance', href: MaintenanceController.dashboard() },
        { title: 'Parc équipements', href: ParcEquipementController.index() },
    ],
};
