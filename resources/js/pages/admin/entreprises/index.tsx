import { Head, Link, useForm } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import AdminEntrepriseController from '@/actions/App/Http/Controllers/Admin/EntrepriseController';
import { Badge } from '@/components/ui/badge';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type EntrepriseResume = {
    id: number;
    nom: string;
    email_contact: string | null;
    telephone_contact: string | null;
    statut: 'active' | 'suspendue' | 'essai';
    users_count: number;
    appartements_count: number;
    employes_count: number;
};

const STATUT_LABELS: Record<string, string> = { active: 'Active', suspendue: 'Suspendue', essai: 'Essai' };
const STATUT_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive'> = {
    active: 'default',
    essai: 'secondary',
    suspendue: 'destructive',
};

const emptyForm = { nom: '', email_contact: '', telephone_contact: '', adresse: '', statut: 'essai', notes: '' };

export default function Entreprises({ entreprises }: { entreprises: EntrepriseResume[] }) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editing, setEditing] = useState<EntrepriseResume | null>(null);

    const createForm = useForm(emptyForm);
    const editForm = useForm(emptyForm);

    function openEdit(entreprise: EntrepriseResume) {
        editForm.setData({
            nom: entreprise.nom,
            email_contact: entreprise.email_contact ?? '',
            telephone_contact: entreprise.telephone_contact ?? '',
            adresse: '',
            statut: entreprise.statut,
            notes: '',
        });
        setEditing(entreprise);
    }

    function submitCreate(e: FormEvent) {
        e.preventDefault();
        createForm.post(AdminEntrepriseController.store().url, {
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
        editForm.put(AdminEntrepriseController.update(editing.id).url, {
            preserveScroll: true,
            onSuccess: () => setEditing(null),
        });
    }

    const columns: ColumnDef<EntrepriseResume>[] = [
        {
            id: 'nom',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Entreprise <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <Link href={`/admin/entreprises/${row.original.id}/utilisateurs`} className="font-medium hover:underline">{row.original.nom}</Link>,
        },
        {
            accessorKey: 'statut',
            header: 'Statut',
            cell: ({ row }) => <Badge variant={STATUT_VARIANTS[row.original.statut]}>{STATUT_LABELS[row.original.statut]}</Badge>,
        },
        {
            id: 'contact',
            header: 'Contact',
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {row.original.email_contact ?? '—'}
                    {row.original.telephone_contact && ` · ${row.original.telephone_contact}`}
                </span>
            ),
        },
        {
            id: 'compteurs',
            header: 'Utilisateurs / Appartements / Employés',
            cell: ({ row }) => (
                <span className="text-sm">
                    {row.original.users_count} / {row.original.appartements_count} / {row.original.employes_count}
                </span>
            ),
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const entreprise = row.original;
                return (
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/entreprises/${entreprise.id}/utilisateurs`}>Utilisateurs</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/entreprises/${entreprise.id}/appartements`}>Appartements</Link>
                        </Button>
                        <Button size="sm" onClick={() => openEdit(entreprise)}>
                            Modifier
                        </Button>
                    </div>
                );
            },
        },
    ];

    return (
        <>
            <Head title="Entreprises" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Entreprises</h1>
                    <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) createForm.reset(); }}>
                        <DialogTrigger asChild>
                            <Button>Nouvelle entreprise</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Nouvelle entreprise cliente</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={submitCreate} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="c_nom">Nom</Label>
                                    <Input id="c_nom" value={createForm.data.nom} onChange={(e) => createForm.setData('nom', e.target.value)} />
                                    {createForm.errors.nom && <p className="text-sm text-destructive">{createForm.errors.nom}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="c_email">E-mail de contact</Label>
                                        <Input id="c_email" type="email" value={createForm.data.email_contact} onChange={(e) => createForm.setData('email_contact', e.target.value)} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="c_tel">Téléphone</Label>
                                        <Input id="c_tel" value={createForm.data.telephone_contact} onChange={(e) => createForm.setData('telephone_contact', e.target.value)} />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="c_adresse">Adresse</Label>
                                    <Input id="c_adresse" value={createForm.data.adresse} onChange={(e) => createForm.setData('adresse', e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="c_statut">Statut</Label>
                                    <Select value={createForm.data.statut} onValueChange={(v) => createForm.setData('statut', v)}>
                                        <SelectTrigger id="c_statut">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="essai">Essai</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="suspendue">Suspendue</SelectItem>
                                        </SelectContent>
                                    </Select>
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

                <DataTable columns={columns} data={entreprises} searchPlaceholder="Rechercher une entreprise..." />
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
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="e_email">E-mail de contact</Label>
                                <Input id="e_email" type="email" value={editForm.data.email_contact} onChange={(e) => editForm.setData('email_contact', e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="e_tel">Téléphone</Label>
                                <Input id="e_tel" value={editForm.data.telephone_contact} onChange={(e) => editForm.setData('telephone_contact', e.target.value)} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="e_statut">Statut</Label>
                            <Select value={editForm.data.statut} onValueChange={(v) => editForm.setData('statut', v)}>
                                <SelectTrigger id="e_statut">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="essai">Essai</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="suspendue">Suspendue</SelectItem>
                                </SelectContent>
                            </Select>
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
