import { Head, router, useForm } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import MaintenanceController from '@/actions/App/Http/Controllers/MaintenanceController';
import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
    EtapeBadge,
    PrioriteBadge,
    SlaBadge,
    fmtDateHeure,
    nomComplet,
} from './shared';
import { PRIORITE_LABELS, PRIORITES } from './shared';
import type { InterventionRow, Priorite, Technicien } from './shared';

/**
 * Écran 1 du pôle — le triage. Tout ce qui n'est pas encore parti en atelier :
 * signalé, planifié, technicien affecté. Chacune des trois actions vaut prise en charge
 * et arrête donc le compteur SLA côté serveur (R2) ; rien n'est décidé ici côté client.
 */
type Filters = {
    equipement_id?: string | number | null;
    appartement_id?: string | number | null;
    priorite?: Priorite | null;
};

const TOUS = '__tous__';

export default function MaintenancePannes({
    interventions,
    techniciens,
    appartements,
    equipements,
    filters,
}: {
    interventions: InterventionRow[];
    techniciens: Technicien[];
    appartements: { id: number; numero: string }[];
    equipements: { id: number; nom: string }[];
    filters: Filters;
}) {
    const [equipementId, setEquipementId] = useState(
        filters.equipement_id ? String(filters.equipement_id) : TOUS,
    );
    const [appartementId, setAppartementId] = useState(
        filters.appartement_id ? String(filters.appartement_id) : TOUS,
    );
    const [priorite, setPriorite] = useState<string>(filters.priorite ?? TOUS);

    // Le libelle de l'equipement filtre, pour dire a l'utilisateur venu d'une
    // notification OU il vient d'atterrir plutot que de le laisser deviner.
    const equipementFiltre = equipements.find(
        (e) => String(e.id) === equipementId,
    );

    function filtrer(e: FormEvent) {
        e.preventDefault();
        router.get(
            MaintenanceController.pannes().url,
            {
                equipement_id: equipementId === TOUS ? undefined : equipementId,
                appartement_id:
                    appartementId === TOUS ? undefined : appartementId,
                priorite: priorite === TOUS ? undefined : priorite,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    function reinitialiser() {
        setEquipementId(TOUS);
        setAppartementId(TOUS);
        setPriorite(TOUS);
        router.get(
            MaintenanceController.pannes().url,
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    const [aPlanifier, setAPlanifier] = useState<InterventionRow | null>(null);

    const planification = useForm({ date_planifiee: '' });

    function prendreEnCharge(intervention: InterventionRow) {
        router.patch(
            MaintenanceController.prendreEnCharge(intervention.id).url,
            {},
            { preserveScroll: true },
        );
    }

    function affecter(intervention: InterventionRow, technicienId: number) {
        router.patch(
            MaintenanceController.affecter(intervention.id).url,
            { technicien_employe_id: technicienId },
            { preserveScroll: true },
        );
    }

    function demarrer(intervention: InterventionRow) {
        router.patch(
            MaintenanceController.changerEtape(intervention.id).url,
            { etape: 'en_cours' },
            { preserveScroll: true },
        );
    }

    function ouvrirPlanification(intervention: InterventionRow) {
        planification.setData(
            'date_planifiee',
            intervention.date_planifiee?.slice(0, 16) ?? '',
        );
        setAPlanifier(intervention);
    }

    function soumettrePlanification(e: FormEvent) {
        e.preventDefault();

        if (!aPlanifier) {
            return;
        }

        planification.patch(
            MaintenanceController.planifier(aPlanifier.id).url,
            {
                preserveScroll: true,
                onSuccess: () => {
                    planification.reset();
                    setAPlanifier(null);
                },
            },
        );
    }

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
                <span className="line-clamp-2 max-w-sm">
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
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const intervention = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Ouvrir le menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            {!intervention.date_prise_en_charge && (
                                <DropdownMenuItem
                                    onClick={() =>
                                        prendreEnCharge(intervention)
                                    }
                                >
                                    Prendre en charge
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={() =>
                                    ouvrirPlanification(intervention)
                                }
                            >
                                Planifier une date
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                    Affecter un technicien
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                    {techniciens.length === 0 ? (
                                        <DropdownMenuItem disabled>
                                            Aucun technicien actif
                                        </DropdownMenuItem>
                                    ) : (
                                        techniciens.map((technicien) => (
                                            <DropdownMenuItem
                                                key={technicien.id}
                                                onClick={() =>
                                                    affecter(
                                                        intervention,
                                                        technicien.id,
                                                    )
                                                }
                                            >
                                                {technicien.prenom}{' '}
                                                {technicien.nom}
                                                {technicien.poste
                                                    ? ` — ${technicien.poste}`
                                                    : ''}
                                            </DropdownMenuItem>
                                        ))
                                    )}
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => demarrer(intervention)}
                            >
                                Démarrer la réparation
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    return (
        <>
            <Head title="Prise en charge des pannes" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Prise en charge des pannes
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {equipementFiltre
                            ? `Filtré sur « ${equipementFiltre.nom} » — ${interventions.length} panne(s) encore à traiter.`
                            : 'Les pannes déclarées par la réception, triées par priorité puis par ancienneté.'}
                    </p>
                </div>

                <form
                    onSubmit={filtrer}
                    className="grid grid-cols-2 gap-3 rounded-md border p-3 md:grid-cols-4 md:items-end"
                >
                    <div className="grid gap-1.5">
                        <Label htmlFor="f-equipement">Équipement</Label>
                        <Select
                            value={equipementId}
                            onValueChange={setEquipementId}
                        >
                            <SelectTrigger id="f-equipement">
                                <SelectValue placeholder="Tous" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TOUS}>Tous</SelectItem>
                                {equipements.map((e) => (
                                    <SelectItem key={e.id} value={String(e.id)}>
                                        {e.nom}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

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
                        <Label htmlFor="f-priorite">Priorité</Label>
                        <Select value={priorite} onValueChange={setPriorite}>
                            <SelectTrigger id="f-priorite">
                                <SelectValue placeholder="Toutes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TOUS}>Toutes</SelectItem>
                                {PRIORITES.map((p) => (
                                    <SelectItem key={p} value={p}>
                                        {PRIORITE_LABELS[p]}
                                    </SelectItem>
                                ))}
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
                    searchPlaceholder="Rechercher un équipement, un appartement..."
                />
            </div>

            <Dialog
                open={aPlanifier !== null}
                onOpenChange={(open) => !open && setAPlanifier(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Planifier — {aPlanifier?.equipement?.nom}
                        </DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={soumettrePlanification}
                        className="space-y-4"
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="date_planifiee">
                                Date et heure d'intervention
                            </Label>
                            <Input
                                id="date_planifiee"
                                type="datetime-local"
                                value={planification.data.date_planifiee}
                                onChange={(e) =>
                                    planification.setData(
                                        'date_planifiee',
                                        e.target.value,
                                    )
                                }
                            />
                            {planification.errors.date_planifiee && (
                                <p className="text-sm text-destructive">
                                    {planification.errors.date_planifiee}
                                </p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={planification.processing}
                            >
                                {planification.processing
                                    ? 'Enregistrement...'
                                    : 'Planifier'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

MaintenancePannes.layout = {
    breadcrumbs: [
        { title: 'Maintenance', href: MaintenanceController.dashboard() },
        {
            title: 'Prise en charge des pannes',
            href: MaintenanceController.pannes(),
        },
    ],
};
