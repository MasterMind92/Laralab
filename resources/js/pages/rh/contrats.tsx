import { Head, useForm } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Plus, UserCheck } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import ContratTravailController from '@/actions/App/Http/Controllers/ContratTravailController';
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
    DialogTrigger,
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

type ContratResume = {
    id: number;
    employe: { id: number; nom: string; prenom: string };
    type_contrat: 'cdi' | 'cdd' | 'stage';
    salaire: string;
    date_debut: string;
    date_fin: string | null;
};

type Employe = { id: number; nom: string; prenom: string };

type CandidatAEmbaucher = {
    id: number;
    nom: string;
    prenom: string;
    salaire_propose: string | null;
    recrutement: { id: number; poste: string };
};

const TYPE_CONTRAT_LABELS: Record<string, string> = { cdi: 'CDI', cdd: 'CDD', stage: 'Stage' };

function formatFcfa(n: number): string {
    return n.toLocaleString('fr-FR');
}

export default function Contrats({
    contrats,
    employes,
    candidatsAEmbaucher,
}: {
    contrats: ContratResume[];
    employes: Employe[];
    candidatsAEmbaucher: CandidatAEmbaucher[];
}) {
    const [createOpen, setCreateOpen] = useState(false);
    const [embauchant, setEmbauchant] = useState<CandidatAEmbaucher | null>(null);

    const createForm = useForm<{
        employe_id: string;
        type_contrat: string;
        salaire: string;
        date_debut: string;
        date_fin: string;
        fichier_contrat: File | null;
    }>({
        employe_id: '',
        type_contrat: 'cdi',
        salaire: '',
        date_debut: '',
        date_fin: '',
        fichier_contrat: null,
    });

    const embaucherForm = useForm({ type_contrat: 'cdi', date_debut: '' });

    function submitCreate(e: FormEvent) {
        e.preventDefault();
        createForm.post(ContratTravailController.store().url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                setCreateOpen(false);
            },
        });
    }

    function submitEmbaucher(e: FormEvent) {
        e.preventDefault();
        if (!embauchant) return;
        embaucherForm.post(ContratTravailController.embaucher(embauchant.id).url, {
            preserveScroll: true,
            onSuccess: () => {
                embaucherForm.reset();
                setEmbauchant(null);
            },
        });
    }

    const columns: ColumnDef<ContratResume>[] = [
        {
            id: 'employe',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Employé <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            accessorFn: (c) => `${c.employe.nom} ${c.employe.prenom}`,
        },
        {
            accessorKey: 'type_contrat',
            header: 'Type',
            cell: ({ row }) => <Badge variant="outline">{TYPE_CONTRAT_LABELS[row.original.type_contrat]}</Badge>,
        },
        {
            id: 'salaire',
            header: 'Salaire',
            cell: ({ row }) => `${formatFcfa(Number(row.original.salaire))} FCFA`,
        },
        {
            id: 'periode',
            header: 'Période',
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {new Date(row.original.date_debut).toLocaleDateString('fr-FR')}
                    {' → '}
                    {row.original.date_fin ? new Date(row.original.date_fin).toLocaleDateString('fr-FR') : 'en cours'}
                </span>
            ),
        },
    ];

    return (
        <>
            <Head title="Contrats de travail" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Contrats de travail</h1>
                    <div className="flex gap-2">
                        <ExportDialog exportUrl={ContratTravailController.export().url} />
                        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) createForm.reset(); }}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus /> Nouveau contrat
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Nouveau contrat (renouvellement/avenant)</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={submitCreate} className="space-y-4" encType="multipart/form-data">
                                    <div className="grid gap-2">
                                        <Label htmlFor="ct_employe">Employé</Label>
                                        <Select value={createForm.data.employe_id} onValueChange={(v) => createForm.setData('employe_id', v)}>
                                            <SelectTrigger id="ct_employe">
                                                <SelectValue placeholder="Choisir un employé" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {employes.map((e) => (
                                                    <SelectItem key={e.id} value={String(e.id)}>{e.nom} {e.prenom}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {createForm.errors.employe_id && <p className="text-sm text-destructive">{createForm.errors.employe_id}</p>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="ct_type">Type de contrat</Label>
                                            <Select value={createForm.data.type_contrat} onValueChange={(v) => createForm.setData('type_contrat', v)}>
                                                <SelectTrigger id="ct_type">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="cdi">CDI</SelectItem>
                                                    <SelectItem value="cdd">CDD</SelectItem>
                                                    <SelectItem value="stage">Stage</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="ct_salaire">Salaire</Label>
                                            <Input id="ct_salaire" type="number" min={0} step="0.01" value={createForm.data.salaire} onChange={(e) => createForm.setData('salaire', e.target.value)} />
                                            {createForm.errors.salaire && <p className="text-sm text-destructive">{createForm.errors.salaire}</p>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="ct_debut">Date de début</Label>
                                            <Input id="ct_debut" type="date" value={createForm.data.date_debut} onChange={(e) => createForm.setData('date_debut', e.target.value)} />
                                            {createForm.errors.date_debut && <p className="text-sm text-destructive">{createForm.errors.date_debut}</p>}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="ct_fin">Date de fin (optionnel)</Label>
                                            <Input id="ct_fin" type="date" value={createForm.data.date_fin} onChange={(e) => createForm.setData('date_fin', e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="ct_fichier">Fichier du contrat (optionnel)</Label>
                                        <Input id="ct_fichier" type="file" accept=".pdf,.doc,.docx" onChange={(e) => createForm.setData('fichier_contrat', e.target.files?.[0] ?? null)} />
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

                {candidatsAEmbaucher.length > 0 && (
                    <div className="rounded-md border bg-muted/30 p-4">
                        <p className="text-sm font-medium mb-3">Candidats ayant accepté une offre — à embaucher</p>
                        <div className="flex flex-col gap-2">
                            {candidatsAEmbaucher.map((c) => (
                                <div key={c.id} className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm">
                                    <span>
                                        {c.nom} {c.prenom} — {c.recrutement.poste}
                                        {c.salaire_propose && ` · ${formatFcfa(Number(c.salaire_propose))} FCFA`}
                                    </span>
                                    <Button size="sm" onClick={() => setEmbauchant(c)}><UserCheck /> Embaucher</Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <DataTable columns={columns} data={contrats} searchPlaceholder="Rechercher un contrat..." />
            </div>

            <Dialog open={embauchant !== null} onOpenChange={(open) => !open && setEmbauchant(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Embaucher {embauchant?.nom} {embauchant?.prenom}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEmbaucher} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="em_type">Type de contrat</Label>
                            <Select value={embaucherForm.data.type_contrat} onValueChange={(v) => embaucherForm.setData('type_contrat', v)}>
                                <SelectTrigger id="em_type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cdi">CDI</SelectItem>
                                    <SelectItem value="cdd">CDD</SelectItem>
                                    <SelectItem value="stage">Stage</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="em_debut">Date de début</Label>
                            <Input id="em_debut" type="date" value={embaucherForm.data.date_debut} onChange={(e) => embaucherForm.setData('date_debut', e.target.value)} />
                            {embaucherForm.errors.date_debut && <p className="text-sm text-destructive">{embaucherForm.errors.date_debut}</p>}
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={embaucherForm.processing}>
                                {embaucherForm.processing ? 'Enregistrement...' : 'Confirmer l\'embauche'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
