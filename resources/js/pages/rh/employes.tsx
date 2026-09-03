import { Head, router, useForm } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import EmployeController from '@/actions/App/Http/Controllers/EmployeController';
import LicenciementController from '@/actions/App/Http/Controllers/LicenciementController';
import OnboardingTacheController from '@/actions/App/Http/Controllers/OnboardingTacheController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/data-table/data-table';
import { ExportDialog } from '@/components/data-table/export-dialog';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ContratActif = {
    type_contrat: 'cdi' | 'cdd' | 'stage';
    salaire: string | null;
};

type OnboardingTacheResume = {
    id: number;
    libelle: string;
    fait: boolean;
};

type LicenciementResume = {
    motif: string;
    date_notification: string;
    date_effective: string;
};

type EmployeResume = {
    id: number;
    nom: string;
    prenom: string;
    poste: string;
    date_embauche: string;
    actif: boolean;
    contrat_actif: ContratActif | null;
    onboarding_taches: OnboardingTacheResume[];
    licenciement: LicenciementResume | null;
};

const TYPE_CONTRAT_LABELS: Record<string, string> = {
    cdi: 'CDI',
    cdd: 'CDD',
    stage: 'Stage',
};

function formatFcfa(n: number): string {
    return n.toLocaleString('fr-FR');
}

const emptyForm = {
    nom: '',
    prenom: '',
    poste: '',
    date_embauche: '',
    salaire_base: '',
};

export default function Employes({ employes }: { employes: EmployeResume[] }) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editing, setEditing] = useState<EmployeResume | null>(null);
    const [detailsId, setDetailsId] = useState<number | null>(null);
    const [licenciant, setLicenciant] = useState<EmployeResume | null>(null);

    const details = employes.find((e) => e.id === detailsId) ?? null;

    const createForm = useForm(emptyForm);
    const editForm = useForm({ nom: '', prenom: '', poste: '', date_embauche: '' });
    const licenciementForm = useForm({ motif: '', date_notification: '', duree_preavis_jours: '30' });

    function submitLicenciement(e: FormEvent) {
        e.preventDefault();
        if (!licenciant) return;
        licenciementForm.post(LicenciementController.store(licenciant.id).url, {
            preserveScroll: true,
            onSuccess: () => {
                licenciementForm.reset();
                setLicenciant(null);
            },
        });
    }

    function toggleTache(tache: OnboardingTacheResume) {
        router.patch(OnboardingTacheController.update(tache.id).url, { fait: !tache.fait }, { preserveScroll: true });
    }

    function openEdit(employe: EmployeResume) {
        editForm.setData({
            nom: employe.nom,
            prenom: employe.prenom,
            poste: employe.poste,
            date_embauche: employe.date_embauche,
        });
        setEditing(employe);
    }

    function submitCreate(e: FormEvent) {
        e.preventDefault();
        createForm.post(EmployeController.store().url, {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                setCreateOpen(false);
            },
        });
    }

    function submitEdit(e: FormEvent) {
        e.preventDefault();
        if (!editing) return;
        editForm.put(EmployeController.update(editing.id).url, {
            preserveScroll: true,
            onSuccess: () => setEditing(null),
        });
    }

    const columns: ColumnDef<EmployeResume>[] = [
        {
            id: 'nom',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Nom <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            accessorFn: (e) => `${e.nom} ${e.prenom}`,
        },
        { accessorKey: 'poste', header: 'Poste' },
        {
            accessorKey: 'actif',
            header: 'Statut',
            cell: ({ row }) => (
                <Badge variant={row.original.actif ? 'default' : 'secondary'}>
                    {row.original.actif ? 'Actif' : 'Inactif'}
                </Badge>
            ),
        },
        {
            id: 'contrat',
            header: 'Contrat en vigueur',
            cell: ({ row }) => {
                const contrat = row.original.contrat_actif;
                if (!contrat) return <span className="text-muted-foreground text-xs">Aucun</span>;
                return (
                    <span className="text-sm">
                        {TYPE_CONTRAT_LABELS[contrat.type_contrat]}
                        {contrat.salaire && ` — ${formatFcfa(Number(contrat.salaire))} FCFA`}
                    </span>
                );
            },
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const employe = row.original;
                return (
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setDetailsId(employe.id)}>
                            Détails
                        </Button>
                        <Button size="sm" onClick={() => openEdit(employe)}>
                            Modifier
                        </Button>
                        {employe.actif && (
                            <Button variant="destructive" size="sm" onClick={() => setLicenciant(employe)}>
                                Licencier
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <>
            <Head title="Employés" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Employés</h1>
                    <div className="flex gap-2">
                        <ExportDialog exportUrl={EmployeController.export().url} />
                        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) createForm.reset(); }}>
                            <DialogTrigger asChild>
                                <Button>Ajouter</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Nouvel employé</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={submitCreate} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="c_nom">Nom</Label>
                                            <Input id="c_nom" value={createForm.data.nom} onChange={(e) => createForm.setData('nom', e.target.value)} />
                                            {createForm.errors.nom && <p className="text-sm text-destructive">{createForm.errors.nom}</p>}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="c_prenom">Prénom</Label>
                                            <Input id="c_prenom" value={createForm.data.prenom} onChange={(e) => createForm.setData('prenom', e.target.value)} />
                                            {createForm.errors.prenom && <p className="text-sm text-destructive">{createForm.errors.prenom}</p>}
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="c_poste">Poste</Label>
                                        <Input id="c_poste" value={createForm.data.poste} onChange={(e) => createForm.setData('poste', e.target.value)} />
                                        {createForm.errors.poste && <p className="text-sm text-destructive">{createForm.errors.poste}</p>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="c_date_embauche">Date d'embauche</Label>
                                            <Input id="c_date_embauche" type="date" value={createForm.data.date_embauche} onChange={(e) => createForm.setData('date_embauche', e.target.value)} />
                                            {createForm.errors.date_embauche && <p className="text-sm text-destructive">{createForm.errors.date_embauche}</p>}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="c_salaire">Salaire de base</Label>
                                            <Input id="c_salaire" type="number" min={0} step="0.01" value={createForm.data.salaire_base} onChange={(e) => createForm.setData('salaire_base', e.target.value)} />
                                            {createForm.errors.salaire_base && <p className="text-sm text-destructive">{createForm.errors.salaire_base}</p>}
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" disabled={createForm.processing}>
                                            {createForm.processing ? 'Enregistrement...' : 'Créer'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <DataTable columns={columns} data={employes} searchPlaceholder="Rechercher un employé..." />
            </div>

            <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Modifier {editing?.nom}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEdit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="e_nom">Nom</Label>
                                <Input id="e_nom" value={editForm.data.nom} onChange={(e) => editForm.setData('nom', e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="e_prenom">Prénom</Label>
                                <Input id="e_prenom" value={editForm.data.prenom} onChange={(e) => editForm.setData('prenom', e.target.value)} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="e_poste">Poste</Label>
                            <Input id="e_poste" value={editForm.data.poste} onChange={(e) => editForm.setData('poste', e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="e_date_embauche">Date d'embauche</Label>
                            <Input id="e_date_embauche" type="date" value={editForm.data.date_embauche} onChange={(e) => editForm.setData('date_embauche', e.target.value)} />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={editForm.processing}>
                                {editForm.processing ? 'Enregistrement...' : 'Enregistrer'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={details !== null} onOpenChange={(open) => !open && setDetailsId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{details?.nom} {details?.prenom}</DialogTitle>
                    </DialogHeader>
                    {details && (
                        <div className="space-y-2 text-sm">
                            <p><span className="text-muted-foreground">Poste : </span>{details.poste}</p>
                            <p><span className="text-muted-foreground">Embauché le : </span>{new Date(details.date_embauche).toLocaleDateString('fr-FR')}</p>
                            <p><span className="text-muted-foreground">Statut : </span>{details.actif ? 'Actif' : 'Inactif'}</p>
                            <p>
                                <span className="text-muted-foreground">Contrat en vigueur : </span>
                                {details.contrat_actif
                                    ? `${TYPE_CONTRAT_LABELS[details.contrat_actif.type_contrat]}${details.contrat_actif.salaire ? ` — ${formatFcfa(Number(details.contrat_actif.salaire))} FCFA` : ''}`
                                    : 'Aucun'}
                            </p>

                            {details.licenciement && (
                                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                                    <p className="font-medium text-destructive">Licencié</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Notifié le {new Date(details.licenciement.date_notification).toLocaleDateString('fr-FR')}
                                        {' · '}
                                        Effectif le {new Date(details.licenciement.date_effective).toLocaleDateString('fr-FR')}
                                    </p>
                                    <p className="text-xs mt-1">{details.licenciement.motif}</p>
                                </div>
                            )}

                            {details.onboarding_taches.length > 0 && (
                                <div className="pt-2">
                                    <p className="text-muted-foreground mb-2">Onboarding</p>
                                    <div className="space-y-1.5">
                                        {details.onboarding_taches.map((t) => (
                                            <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                                <Checkbox checked={t.fait} onCheckedChange={() => toggleTache(t)} />
                                                <span className={t.fait ? 'line-through text-muted-foreground' : ''}>{t.libelle}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={licenciant !== null} onOpenChange={(open) => { if (!open) { setLicenciant(null); licenciementForm.reset(); } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Licencier {licenciant?.nom} {licenciant?.prenom}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitLicenciement} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="l_motif">Motif</Label>
                            <textarea
                                id="l_motif"
                                rows={3}
                                className="border-input flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none"
                                value={licenciementForm.data.motif}
                                onChange={(e) => licenciementForm.setData('motif', e.target.value)}
                            />
                            {licenciementForm.errors.motif && <p className="text-sm text-destructive">{licenciementForm.errors.motif}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="l_date">Date de notification</Label>
                                <Input id="l_date" type="date" value={licenciementForm.data.date_notification} onChange={(e) => licenciementForm.setData('date_notification', e.target.value)} />
                                {licenciementForm.errors.date_notification && <p className="text-sm text-destructive">{licenciementForm.errors.date_notification}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="l_preavis">Préavis (jours)</Label>
                                <Input id="l_preavis" type="number" min={0} value={licenciementForm.data.duree_preavis_jours} onChange={(e) => licenciementForm.setData('duree_preavis_jours', e.target.value)} />
                                {licenciementForm.errors.duree_preavis_jours && <p className="text-sm text-destructive">{licenciementForm.errors.duree_preavis_jours}</p>}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" variant="destructive" disabled={licenciementForm.processing}>
                                {licenciementForm.processing ? 'Enregistrement...' : 'Confirmer le licenciement'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
