import { Head, router, useForm } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import CongeController from '@/actions/App/Http/Controllers/CongeController';
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

type CongeResume = {
    id: number;
    employe: { id: number; nom: string; prenom: string };
    date_debut: string;
    date_fin: string;
    statut: 'demande' | 'valide' | 'refuse';
};

type Employe = { id: number; nom: string; prenom: string };

const STATUT_LABELS: Record<string, string> = { demande: 'En attente', valide: 'Validé', refuse: 'Refusé' };
const STATUT_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive'> = {
    demande: 'secondary',
    valide: 'default',
    refuse: 'destructive',
};

export default function Conges({ conges, employes }: { conges: CongeResume[]; employes: Employe[] }) {
    const [createOpen, setCreateOpen] = useState(false);

    const createForm = useForm({ employe_id: '', date_debut: '', date_fin: '' });

    function submitCreate(e: FormEvent) {
        e.preventDefault();
        createForm.post(CongeController.store().url, {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                setCreateOpen(false);
            },
        });
    }

    function traiter(conge: CongeResume, statut: 'valide' | 'refuse') {
        router.patch(CongeController.update(conge.id).url, { statut }, { preserveScroll: true });
    }

    const columns: ColumnDef<CongeResume>[] = [
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
            id: 'periode',
            header: 'Période',
            cell: ({ row }) => (
                <span className="text-sm">
                    {new Date(row.original.date_debut).toLocaleDateString('fr-FR')}
                    {' → '}
                    {new Date(row.original.date_fin).toLocaleDateString('fr-FR')}
                </span>
            ),
        },
        {
            accessorKey: 'statut',
            header: 'Statut',
            cell: ({ row }) => <Badge variant={STATUT_VARIANTS[row.original.statut]}>{STATUT_LABELS[row.original.statut]}</Badge>,
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const conge = row.original;
                if (conge.statut !== 'demande') return null;
                return (
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => traiter(conge, 'refuse')}>Refuser</Button>
                        <Button size="sm" onClick={() => traiter(conge, 'valide')}>Valider</Button>
                    </div>
                );
            },
        },
    ];

    return (
        <>
            <Head title="Congés" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Congés</h1>
                    <div className="flex gap-2">
                        <ExportDialog exportUrl={CongeController.export().url} />
                        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) createForm.reset(); }}>
                            <DialogTrigger asChild>
                                <Button>Nouvelle demande</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Nouvelle demande de congé</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={submitCreate} className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="cg_employe">Employé</Label>
                                        <Select value={createForm.data.employe_id} onValueChange={(v) => createForm.setData('employe_id', v)}>
                                            <SelectTrigger id="cg_employe">
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
                                            <Label htmlFor="cg_debut">Date de début</Label>
                                            <Input id="cg_debut" type="date" value={createForm.data.date_debut} onChange={(e) => createForm.setData('date_debut', e.target.value)} />
                                            {createForm.errors.date_debut && <p className="text-sm text-destructive">{createForm.errors.date_debut}</p>}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="cg_fin">Date de fin</Label>
                                            <Input id="cg_fin" type="date" value={createForm.data.date_fin} onChange={(e) => createForm.setData('date_fin', e.target.value)} />
                                            {createForm.errors.date_fin && <p className="text-sm text-destructive">{createForm.errors.date_fin}</p>}
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" disabled={createForm.processing}>
                                            {createForm.processing ? 'Enregistrement...' : 'Soumettre'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <DataTable columns={columns} data={conges} searchPlaceholder="Rechercher un congé..." />
            </div>
        </>
    );
}
