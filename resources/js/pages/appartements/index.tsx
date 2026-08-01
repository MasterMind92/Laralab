import { Head, router, useForm } from '@inertiajs/react';
import { MoreHorizontal } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import AppartementController from '@/actions/App/Http/Controllers/AppartementController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type StatutEntretien = 'propre' | 'a_nettoyer' | 'en_maintenance';

type Appartement = {
    id: number;
    numero: string;
    capacite: number;
    prix_nuit: string;
    statut_entretien: StatutEntretien;
};

type AppartementFormValues = {
    numero: string;
    capacite: number | string;
    prix_nuit: number | string;
    statut_entretien: StatutEntretien;
};

const STATUT_LABELS: Record<StatutEntretien, string> = {
    propre: 'Propre',
    a_nettoyer: 'À nettoyer',
    en_maintenance: 'En maintenance',
};

const STATUT_VARIANTS: Record<StatutEntretien, 'default' | 'secondary' | 'destructive'> = {
    propre: 'default',
    a_nettoyer: 'secondary',
    en_maintenance: 'destructive',
};

const emptyForm: AppartementFormValues = {
    numero: '',
    capacite: '',
    prix_nuit: '',
    statut_entretien: 'propre',
};

function AppartementFormFields({
    form,
    onSubmit,
    submitLabel,
}: {
    form: ReturnType<typeof useForm<AppartementFormValues>>;
    onSubmit: (e: FormEvent) => void;
    submitLabel: string;
}) {
    const { data, setData, errors, processing } = form;

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="numero">Numéro</Label>
                <Input id="numero" value={data.numero} onChange={(e) => setData('numero', e.target.value)} />
                {errors.numero && <p className="text-sm text-destructive">{errors.numero}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="capacite">Capacité</Label>
                    <Input
                        id="capacite"
                        type="number"
                        min={1}
                        value={data.capacite}
                        onChange={(e) => setData('capacite', e.target.value)}
                    />
                    {errors.capacite && <p className="text-sm text-destructive">{errors.capacite}</p>}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="prix_nuit">Prix / nuit</Label>
                    <Input
                        id="prix_nuit"
                        type="number"
                        min={0}
                        step="0.01"
                        value={data.prix_nuit}
                        onChange={(e) => setData('prix_nuit', e.target.value)}
                    />
                    {errors.prix_nuit && <p className="text-sm text-destructive">{errors.prix_nuit}</p>}
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="statut_entretien">Entretien</Label>
                <Select
                    value={data.statut_entretien}
                    onValueChange={(value) => setData('statut_entretien', value as StatutEntretien)}
                >
                    <SelectTrigger id="statut_entretien">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="propre">Propre</SelectItem>
                        <SelectItem value="a_nettoyer">À nettoyer</SelectItem>
                        <SelectItem value="en_maintenance">En maintenance</SelectItem>
                    </SelectContent>
                </Select>
                {errors.statut_entretien && <p className="text-sm text-destructive">{errors.statut_entretien}</p>}
            </div>

            <DialogFooter>
                <Button type="submit" disabled={processing}>
                    {processing ? 'Enregistrement...' : submitLabel}
                </Button>
            </DialogFooter>
        </form>
    );
}

export default function AppartementsIndex({ appartements }: { appartements: Appartement[] }) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editing, setEditing] = useState<Appartement | null>(null);

    const createForm = useForm<AppartementFormValues>(emptyForm);
    const editForm = useForm<AppartementFormValues>(emptyForm);

    function openEdit(appartement: Appartement) {
        editForm.setData({
            numero: appartement.numero,
            capacite: appartement.capacite,
            prix_nuit: appartement.prix_nuit,
            statut_entretien: appartement.statut_entretien,
        });
        setEditing(appartement);
    }

    function submitCreate(e: FormEvent) {
        e.preventDefault();
        createForm.post(AppartementController.store().url, {
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
        editForm.put(AppartementController.update(editing.id).url, {
            preserveScroll: true,
            onSuccess: () => setEditing(null),
        });
    }

    function destroy(appartement: Appartement) {
        if (!confirm(`Supprimer l'appartement ${appartement.numero} ?`)) return;
        router.delete(AppartementController.destroy(appartement.id).url, { preserveScroll: true });
    }

    return (
        <>
            <Head title="Appartements" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Appartements</h1>
                    <Dialog
                        open={createOpen}
                        onOpenChange={(open) => {
                            setCreateOpen(open);
                            if (!open) createForm.reset();
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button>Ajouter un appartement</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Nouvel appartement</DialogTitle>
                            </DialogHeader>
                            <AppartementFormFields form={createForm} onSubmit={submitCreate} submitLabel="Créer" />
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="overflow-hidden rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Numéro</TableHead>
                                <TableHead>Capacité</TableHead>
                                <TableHead>Prix / nuit</TableHead>
                                <TableHead>Entretien</TableHead>
                                <TableHead className="w-10" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {appartements.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        Aucun appartement pour le moment.
                                    </TableCell>
                                </TableRow>
                            )}
                            {appartements.map((appartement) => (
                                <TableRow key={appartement.id}>
                                    <TableCell className="font-medium">{appartement.numero}</TableCell>
                                    <TableCell>{appartement.capacite}</TableCell>
                                    <TableCell>{Number(appartement.prix_nuit).toLocaleString('fr-FR')}</TableCell>
                                    <TableCell>
                                        <Badge variant={STATUT_VARIANTS[appartement.statut_entretien]}>
                                            {STATUT_LABELS[appartement.statut_entretien]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Ouvrir le menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => openEdit(appartement)}>
                                                    Modifier
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => destroy(appartement)}>
                                                    <span className="text-red-500">Supprimer</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Modifier {editing?.numero}</DialogTitle>
                    </DialogHeader>
                    <AppartementFormFields form={editForm} onSubmit={submitEdit} submitLabel="Enregistrer" />
                </DialogContent>
            </Dialog>
        </>
    );
}

AppartementsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Appartements',
            href: AppartementController.index(),
        },
    ],
};
