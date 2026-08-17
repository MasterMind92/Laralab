import { Head, useForm } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import AdminPartenaireController from '@/actions/App/Http/Controllers/Admin/PartenaireController';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table/data-table';
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

type PartenaireResume = {
    id: number;
    nom: string;
    contact: string | null;
    type_service: string | null;
};

const emptyForm = { nom: '', contact: '', type_service: '' };

export default function Partenaires({ partenaires }: { partenaires: PartenaireResume[] }) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editing, setEditing] = useState<PartenaireResume | null>(null);

    const createForm = useForm(emptyForm);
    const editForm = useForm(emptyForm);

    function openEdit(partenaire: PartenaireResume) {
        editForm.setData({ nom: partenaire.nom, contact: partenaire.contact ?? '', type_service: partenaire.type_service ?? '' });
        setEditing(partenaire);
    }

    function submitCreate(e: FormEvent) {
        e.preventDefault();
        createForm.post(AdminPartenaireController.store().url, {
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
        editForm.put(AdminPartenaireController.update(editing.id).url, {
            preserveScroll: true,
            onSuccess: () => setEditing(null),
        });
    }

    const columns: ColumnDef<PartenaireResume>[] = [
        {
            id: 'nom',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Nom <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            accessorKey: 'nom',
        },
        { accessorKey: 'contact', header: 'Contact', cell: ({ row }) => row.original.contact ?? '—' },
        { accessorKey: 'type_service', header: 'Type de service', cell: ({ row }) => row.original.type_service ?? '—' },
        {
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <Button size="sm" onClick={() => openEdit(row.original)}>
                        Modifier
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title="Partenaires" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Partenaires</h1>
                    <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) createForm.reset(); }}>
                        <DialogTrigger asChild>
                            <Button>Nouveau partenaire</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Nouveau partenaire</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={submitCreate} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="c_nom">Nom</Label>
                                    <Input id="c_nom" value={createForm.data.nom} onChange={(e) => createForm.setData('nom', e.target.value)} />
                                    {createForm.errors.nom && <p className="text-sm text-destructive">{createForm.errors.nom}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="c_contact">Contact</Label>
                                    <Input id="c_contact" value={createForm.data.contact} onChange={(e) => createForm.setData('contact', e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="c_type">Type de service</Label>
                                    <Input id="c_type" value={createForm.data.type_service} onChange={(e) => createForm.setData('type_service', e.target.value)} />
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

                <DataTable columns={columns} data={partenaires} searchPlaceholder="Rechercher un partenaire..." />
            </div>

            <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Modifier {editing?.nom}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEdit} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="e_nom">Nom</Label>
                            <Input id="e_nom" value={editForm.data.nom} onChange={(e) => editForm.setData('nom', e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="e_contact">Contact</Label>
                            <Input id="e_contact" value={editForm.data.contact} onChange={(e) => editForm.setData('contact', e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="e_type">Type de service</Label>
                            <Input id="e_type" value={editForm.data.type_service} onChange={(e) => editForm.setData('type_service', e.target.value)} />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={editForm.processing}>
                                {editForm.processing ? 'Enregistrement...' : 'Enregistrer'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
