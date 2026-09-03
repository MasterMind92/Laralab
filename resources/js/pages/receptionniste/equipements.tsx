import { Head, router, useForm } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import InterventionController from '@/actions/App/Http/Controllers/InterventionController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table/data-table';
import { ExportDialog } from '@/components/data-table/export-dialog';
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

type StatutEquipement = 'stock' | 'affecte' | 'en_panne' | 'reforme';

type EtapeIntervention =
    | 'signalee' | 'planifiee' | 'technicien_affecte' | 'en_cours' | 'reparee' | 'controlee' | 'cloturee' | 'reformee';

type InterventionResume = {
    id: number;
    description_panne: string;
    date_signalement: string;
    date_resolution: string | null;
    etape: EtapeIntervention;
};

const ETAPE_LABELS: Record<EtapeIntervention, string> = {
    signalee: 'Signalée',
    planifiee: 'Planifiée',
    technicien_affecte: 'Technicien affecté',
    en_cours: 'En cours',
    reparee: 'Réparée',
    controlee: 'Contrôlée',
    cloturee: 'Clôturée',
    reformee: 'Réformée',
};

type EquipementResume = {
    id: number;
    nom: string;
    type: string;
    statut: StatutEquipement;
    appartement: { id: number; numero: string } | null;
    interventions: InterventionResume[];
};

type Appartement = { id: number; numero: string };

type Filters = {
    appartement_id?: string | number | null;
    statut?: StatutEquipement | null;
    date_debut?: string | null;
    date_fin?: string | null;
};

const STATUT_LABELS: Record<StatutEquipement, string> = {
    stock: 'En stock',
    affecte: 'Affecté',
    en_panne: 'En panne',
    reforme: 'Réformé',
};

const STATUT_VARIANTS: Record<StatutEquipement, 'default' | 'secondary' | 'destructive'> = {
    stock: 'secondary',
    affecte: 'default',
    en_panne: 'destructive',
    reforme: 'destructive',
};

const ALL_STATUTS_VALUE = '__all__';

function fmt(d: string): string {
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function EquipementsSuivi({
    equipements,
    appartements,
    filters,
}: {
    equipements: EquipementResume[];
    appartements: Appartement[];
    filters: Filters;
}) {
    const [details, setDetails] = useState<EquipementResume | null>(null);
    const [signalement, setSignalement] = useState<EquipementResume | null>(null);

    const [dateDebut, setDateDebut] = useState(filters.date_debut ?? '');
    const [dateFin, setDateFin] = useState(filters.date_fin ?? '');
    const [appartementId, setAppartementId] = useState(filters.appartement_id ? String(filters.appartement_id) : ALL_STATUTS_VALUE);
    const [statut, setStatut] = useState<string>(filters.statut ?? ALL_STATUTS_VALUE);

    // priorite pilote le SLA de prise en charge cote Maintenance (Phase 05, R2) :
    // l'echeance est calculee a la declaration et n'est plus jamais recalculee.
    const form = useForm({ equipement_id: '', description_panne: '', priorite: 'normale' });
    const { data, setData, errors, processing } = form;

    function openSignalement(equipement: EquipementResume) {
        form.reset();
        form.setData('equipement_id', String(equipement.id));
        setSignalement(equipement);
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        form.post(InterventionController.store().url, {
            preserveScroll: true,
            onSuccess: () => setSignalement(null),
        });
    }

    function appliquerFiltres(e: FormEvent) {
        e.preventDefault();
        router.get(
            InterventionController.index().url,
            {
                date_debut: dateDebut || undefined,
                date_fin: dateFin || undefined,
                appartement_id: appartementId === ALL_STATUTS_VALUE ? undefined : appartementId,
                statut: statut === ALL_STATUTS_VALUE ? undefined : statut,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    function reinitialiserFiltres() {
        setDateDebut('');
        setDateFin('');
        setAppartementId(ALL_STATUTS_VALUE);
        setStatut(ALL_STATUTS_VALUE);
        router.get(InterventionController.index().url, {}, { preserveState: true, preserveScroll: true, replace: true });
    }

    const columns: ColumnDef<EquipementResume>[] = [
        {
            id: 'appartement',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Appartement <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            accessorFn: (e) => e.appartement?.numero ?? '',
        },
        {
            accessorKey: 'nom',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Équipement <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
        },
        { accessorKey: 'type', header: 'Type' },
        {
            accessorKey: 'statut',
            header: 'Statut',
            cell: ({ row }) => <Badge variant={STATUT_VARIANTS[row.original.statut]}>{STATUT_LABELS[row.original.statut]}</Badge>,
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const equipement = row.original;
                return (
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setDetails(equipement)}>
                            Détails
                        </Button>
                        <Button size="sm" onClick={() => openSignalement(equipement)}>
                            Signaler une panne
                        </Button>
                    </div>
                );
            },
        },
    ];

    return (
        <>
            <Head title="Suivi des équipements" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Suivi des équipements</h1>
                    <ExportDialog exportUrl={InterventionController.export().url} />
                </div>

                <form onSubmit={appliquerFiltres} className="grid grid-cols-2 gap-3 rounded-md border p-3 md:grid-cols-5 md:items-end">
                    <div className="grid gap-1.5">
                        <Label htmlFor="date_debut">Signalée du</Label>
                        <Input id="date_debut" type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="date_fin">au</Label>
                        <Input id="date_fin" type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="appartement_id">Appartement</Label>
                        <Select value={appartementId} onValueChange={setAppartementId}>
                            <SelectTrigger id="appartement_id">
                                <SelectValue placeholder="Tous" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_STATUTS_VALUE}>Tous</SelectItem>
                                {appartements.map((a) => (
                                    <SelectItem key={a.id} value={String(a.id)}>
                                        {a.numero}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="statut">Statut équipement</Label>
                        <Select value={statut} onValueChange={setStatut}>
                            <SelectTrigger id="statut">
                                <SelectValue placeholder="Tous" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_STATUTS_VALUE}>Tous</SelectItem>
                                <SelectItem value="stock">En stock</SelectItem>
                                <SelectItem value="affecte">Affecté</SelectItem>
                                <SelectItem value="en_panne">En panne</SelectItem>
                                <SelectItem value="reforme">Réformé</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit">Filtrer</Button>
                        <Button type="button" variant="outline" onClick={reinitialiserFiltres}>
                            Réinitialiser
                        </Button>
                    </div>
                </form>

                <DataTable
                    columns={columns}
                    data={equipements}
                    searchPlaceholder="Rechercher un équipement..."
                />
            </div>

            <Dialog open={details !== null} onOpenChange={(open) => !open && setDetails(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{details?.nom}</DialogTitle>
                    </DialogHeader>
                    {details && (
                        <div className="space-y-3 text-sm">
                            <p>
                                <span className="text-muted-foreground">Appartement : </span>
                                {details.appartement?.numero ?? '—'}
                            </p>
                            <p>
                                <span className="text-muted-foreground">Type : </span>
                                {details.type}
                            </p>
                            <p>
                                <span className="text-muted-foreground">Statut : </span>
                                {STATUT_LABELS[details.statut]}
                            </p>
                            <div>
                                <p className="text-muted-foreground mb-2">Historique des interventions</p>
                                {details.interventions.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">Aucune intervention signalée.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {details.interventions.map((intervention) => (
                                            <div key={intervention.id} className="rounded-md border p-2 text-xs">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium">{fmt(intervention.date_signalement)}</span>
                                                    <Badge variant={['cloturee', 'reformee'].includes(intervention.etape) ? 'default' : 'secondary'}>
                                                        {ETAPE_LABELS[intervention.etape]}
                                                    </Badge>
                                                </div>
                                                <p>{intervention.description_panne}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={signalement !== null} onOpenChange={(open) => !open && setSignalement(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Signaler une panne — {signalement?.nom}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="priorite">Priorité</Label>
                            <Select value={data.priorite} onValueChange={(value) => setData('priorite', value)}>
                                <SelectTrigger id="priorite">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="basse">Basse</SelectItem>
                                    <SelectItem value="normale">Normale</SelectItem>
                                    <SelectItem value="haute">Haute</SelectItem>
                                    <SelectItem value="critique">Critique</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-muted-foreground text-xs">
                                Détermine le délai de prise en charge attendu de la maintenance.
                            </p>
                            {errors.priorite && <p className="text-sm text-destructive">{errors.priorite}</p>}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description_panne">Description de la panne</Label>
                            <textarea
                                id="description_panne"
                                rows={4}
                                className="border-input flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none"
                                value={data.description_panne}
                                onChange={(e) => setData('description_panne', e.target.value)}
                            />
                            {errors.description_panne && <p className="text-sm text-destructive">{errors.description_panne}</p>}
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Envoi...' : 'Signaler'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
