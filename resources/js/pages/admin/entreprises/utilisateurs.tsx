import { Head, Link, router, useForm } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, ArrowUpDown } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import AdminUtilisateurController from '@/actions/App/Http/Controllers/Admin/UtilisateurController';
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

type Entreprise = { id: number; nom: string };

type UtilisateurResume = {
    id: number;
    name: string;
    email: string;
    role: string;
    actif: boolean;
};

const ROLE_LABELS: Record<string, string> = {
    proprietaire: 'Propriétaire',
    gerant: 'Gérant',
    rh: 'RH',
    compta: 'Comptabilité',
    logistique: 'Logistique',
    maintenance: 'Maintenance',
    receptionniste: 'Réceptionniste',
};

const ROLES = Object.keys(ROLE_LABELS);

export default function Utilisateurs({ entreprise, utilisateurs }: { entreprise: Entreprise; utilisateurs: UtilisateurResume[] }) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editing, setEditing] = useState<UtilisateurResume | null>(null);

    const createForm = useForm({ name: '', email: '', password: '', password_confirmation: '', role: 'receptionniste' });
    const editForm = useForm({ name: '', email: '', role: 'receptionniste', actif: true });

    function openEdit(utilisateur: UtilisateurResume) {
        editForm.setData({ name: utilisateur.name, email: utilisateur.email, role: utilisateur.role, actif: utilisateur.actif });
        setEditing(utilisateur);
    }

    function submitCreate(e: FormEvent) {
        e.preventDefault();
        createForm.post(AdminUtilisateurController.store(entreprise.id).url, {
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
        editForm.put(AdminUtilisateurController.update([entreprise.id, editing.id]).url, {
            preserveScroll: true,
            onSuccess: () => setEditing(null),
        });
    }

    function toggleActif(utilisateur: UtilisateurResume) {
        if (utilisateur.actif) {
            router.delete(AdminUtilisateurController.destroy([entreprise.id, utilisateur.id]).url, { preserveScroll: true });
        } else {
            router.put(AdminUtilisateurController.update([entreprise.id, utilisateur.id]).url, { name: utilisateur.name, email: utilisateur.email, role: utilisateur.role, actif: true }, { preserveScroll: true });
        }
    }

    const columns: ColumnDef<UtilisateurResume>[] = [
        {
            id: 'name',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Nom <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            accessorKey: 'name',
        },
        { accessorKey: 'email', header: 'E-mail' },
        {
            accessorKey: 'role',
            header: 'Rôle',
            cell: ({ row }) => <Badge variant="outline">{ROLE_LABELS[row.original.role] ?? row.original.role}</Badge>,
        },
        {
            accessorKey: 'actif',
            header: 'Statut',
            cell: ({ row }) => (
                <Badge variant={row.original.actif ? 'default' : 'secondary'}>{row.original.actif ? 'Actif' : 'Désactivé'}</Badge>
            ),
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const utilisateur = row.original;
                return (
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(utilisateur)}>
                            Modifier
                        </Button>
                        <Button variant={utilisateur.actif ? 'destructive' : 'default'} size="sm" onClick={() => toggleActif(utilisateur)}>
                            {utilisateur.actif ? 'Désactiver' : 'Réactiver'}
                        </Button>
                    </div>
                );
            },
        },
    ];

    return (
        <>
            <Head title={`Utilisateurs — ${entreprise.nom}`} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/admin/entreprises">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-semibold">Utilisateurs — {entreprise.nom}</h1>
                    </div>
                    <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) createForm.reset(); }}>
                        <DialogTrigger asChild>
                            <Button>Ajouter un utilisateur</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Nouvel utilisateur</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={submitCreate} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="c_name">Nom</Label>
                                    <Input id="c_name" value={createForm.data.name} onChange={(e) => createForm.setData('name', e.target.value)} />
                                    {createForm.errors.name && <p className="text-sm text-destructive">{createForm.errors.name}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="c_email">E-mail</Label>
                                    <Input id="c_email" type="email" value={createForm.data.email} onChange={(e) => createForm.setData('email', e.target.value)} />
                                    {createForm.errors.email && <p className="text-sm text-destructive">{createForm.errors.email}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="c_role">Rôle</Label>
                                    <Select value={createForm.data.role} onValueChange={(v) => createForm.setData('role', v)}>
                                        <SelectTrigger id="c_role">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ROLES.map((role) => (
                                                <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="c_password">Mot de passe</Label>
                                        <Input id="c_password" type="password" value={createForm.data.password} onChange={(e) => createForm.setData('password', e.target.value)} />
                                        {createForm.errors.password && <p className="text-sm text-destructive">{createForm.errors.password}</p>}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="c_password_confirm">Confirmation</Label>
                                        <Input id="c_password_confirm" type="password" value={createForm.data.password_confirmation} onChange={(e) => createForm.setData('password_confirmation', e.target.value)} />
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

                <DataTable columns={columns} data={utilisateurs} searchPlaceholder="Rechercher un utilisateur..." />
            </div>

            <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Modifier {editing?.name}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEdit} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="e_name">Nom</Label>
                            <Input id="e_name" value={editForm.data.name} onChange={(e) => editForm.setData('name', e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="e_email">E-mail</Label>
                            <Input id="e_email" type="email" value={editForm.data.email} onChange={(e) => editForm.setData('email', e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="e_role">Rôle</Label>
                            <Select value={editForm.data.role} onValueChange={(v) => editForm.setData('role', v)}>
                                <SelectTrigger id="e_role">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLES.map((role) => (
                                        <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>
                                    ))}
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
