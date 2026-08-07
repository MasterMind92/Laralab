import { Head, router, useForm } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import DemandeServiceController from '@/actions/App/Http/Controllers/DemandeServiceController';
import PartenaireController from '@/actions/App/Http/Controllers/PartenaireController';
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

type StatutDemande = 'demandee' | 'livree';

type DemandeRow = {
    id: number;
    designation: string;
    quantite: number;
    prix_unitaire: string;
    statut: StatutDemande;
    created_at: string;
    appartement: { id: number; numero: string } | null;
    partenaire: { id: number; nom: string } | null;
    sejour: { id: number; reservation: { id: number; client: { nom: string; prenom: string } | null } | null } | null;
};

type Appartement = { id: number; numero: string };
type Partenaire = { id: number; nom: string; type_service: string | null };
type SejourEnCours = {
    id: number;
    reservation: { id: number; appartement_id: number; client: { nom: string; prenom: string } | null } | null;
};

const NEW_PARTENAIRE_VALUE = '__new__';
const NONE_VALUE = '__none__';

function fmt(d: string): string {
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DemandesServiceIndex({
    demandes,
    appartements,
    partenaires,
    sejoursEnCours,
}: {
    demandes: DemandeRow[];
    appartements: Appartement[];
    partenaires: Partenaire[];
    sejoursEnCours: SejourEnCours[];
}) {
    const [createOpen, setCreateOpen] = useState(false);
    const [newPartenaire, setNewPartenaire] = useState({ nom: '', contact: '', type_service: '' });

    const form = useForm({
        appartement_id: '',
        sejour_id: '',
        partenaire_id: '',
        designation: '',
        quantite: 1,
        prix_unitaire: '',
    });
    const { data, setData, errors, processing } = form;

    const sejoursDisponibles = useMemo(
        () => sejoursEnCours.filter((s) => String(s.reservation?.appartement_id) === data.appartement_id),
        [sejoursEnCours, data.appartement_id],
    );

    function submitCreate(e: FormEvent) {
        e.preventDefault();
        form.post(DemandeServiceController.store().url, {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setCreateOpen(false);
            },
        });
    }

    function submitNewPartenaire(e: FormEvent) {
        e.preventDefault();
        router.post(PartenaireController.store().url, newPartenaire, {
            preserveScroll: true,
            onSuccess: () => setNewPartenaire({ nom: '', contact: '', type_service: '' }),
        });
    }

    function marquerLivree(demande: DemandeRow) {
        router.patch(DemandeServiceController.update(demande.id).url, {}, { preserveScroll: true });
    }

    function destroy(demande: DemandeRow) {
        if (!confirm(`Supprimer la demande "${demande.designation}" ?`)) return;
        router.delete(DemandeServiceController.destroy(demande.id).url, { preserveScroll: true });
    }

    const columns: ColumnDef<DemandeRow>[] = [
        {
            id: 'appartement',
            header: 'Appartement',
            accessorFn: (d) => d.appartement?.numero ?? '',
        },
        {
            id: 'client',
            header: 'Client',
            accessorFn: (d) => {
                const c = d.sejour?.reservation?.client;
                return c ? `${c.nom} ${c.prenom}` : '—';
            },
        },
        {
            id: 'partenaire',
            header: 'Partenaire',
            accessorFn: (d) => d.partenaire?.nom ?? '—',
        },
        { accessorKey: 'designation', header: 'Désignation' },
        { accessorKey: 'quantite', header: 'Qté' },
        {
            accessorKey: 'prix_unitaire',
            header: 'Prix unitaire',
            cell: ({ row }) => `${Number(row.original.prix_unitaire).toLocaleString('fr-FR')} FCFA`,
        },
        {
            accessorKey: 'statut',
            header: 'Statut',
            cell: ({ row }) => (
                <Badge variant={row.original.statut === 'livree' ? 'default' : 'secondary'}>
                    {row.original.statut === 'livree' ? 'Livrée' : 'Demandée'}
                </Badge>
            ),
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const demande = row.original;
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
                            {demande.statut === 'demandee' && (
                                <DropdownMenuItem onClick={() => marquerLivree(demande)}>Marquer livrée</DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => destroy(demande)}>
                                <span className="text-red-500">Supprimer</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    return (
        <>
            <Head title="Demandes de service" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Demandes de service</h1>
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>Ajouter une demande</Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Nouvelle demande de service</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={submitCreate} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="appartement_id">Appartement</Label>
                                    <Select
                                        value={data.appartement_id}
                                        onValueChange={(value) => setData((d) => ({ ...d, appartement_id: value, sejour_id: '' }))}
                                    >
                                        <SelectTrigger id="appartement_id">
                                            <SelectValue placeholder="Sélectionner un appartement" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {appartements.map((a) => (
                                                <SelectItem key={a.id} value={String(a.id)}>
                                                    {a.numero}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.appartement_id && <p className="text-sm text-destructive">{errors.appartement_id}</p>}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="sejour_id">Séjour en cours (optionnel)</Label>
                                    <Select
                                        value={data.sejour_id || NONE_VALUE}
                                        onValueChange={(value) => setData('sejour_id', value === NONE_VALUE ? '' : value)}
                                    >
                                        <SelectTrigger id="sejour_id">
                                            <SelectValue placeholder="Aucun séjour actif (ex. réapprovisionnement)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={NONE_VALUE}>Aucun (hors séjour)</SelectItem>
                                            {sejoursDisponibles.map((s) => (
                                                <SelectItem key={s.id} value={String(s.id)}>
                                                    {s.reservation?.client ? `${s.reservation.client.nom} ${s.reservation.client.prenom}` : `Séjour #${s.id}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="partenaire_id">Partenaire</Label>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button type="button" variant="link" size="sm" className="h-auto p-0">
                                                    + Nouveau partenaire
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Nouveau partenaire</DialogTitle>
                                                </DialogHeader>
                                                <form onSubmit={submitNewPartenaire} className="space-y-4">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="p_nom">Nom</Label>
                                                        <Input
                                                            id="p_nom"
                                                            value={newPartenaire.nom}
                                                            onChange={(e) => setNewPartenaire((p) => ({ ...p, nom: e.target.value }))}
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="p_contact">Contact</Label>
                                                        <Input
                                                            id="p_contact"
                                                            value={newPartenaire.contact}
                                                            onChange={(e) => setNewPartenaire((p) => ({ ...p, contact: e.target.value }))}
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="p_type">Type de service</Label>
                                                        <Input
                                                            id="p_type"
                                                            placeholder="Restauration, blanchisserie..."
                                                            value={newPartenaire.type_service}
                                                            onChange={(e) => setNewPartenaire((p) => ({ ...p, type_service: e.target.value }))}
                                                        />
                                                    </div>
                                                    <DialogFooter>
                                                        <Button type="submit">Créer</Button>
                                                    </DialogFooter>
                                                </form>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                    <Select
                                        value={data.partenaire_id || NONE_VALUE}
                                        onValueChange={(value) => setData('partenaire_id', value === NONE_VALUE ? '' : value)}
                                    >
                                        <SelectTrigger id="partenaire_id">
                                            <SelectValue placeholder="Aucun partenaire" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={NONE_VALUE}>Aucun</SelectItem>
                                            {partenaires.map((p) => (
                                                <SelectItem key={p.id} value={String(p.id)}>
                                                    {p.nom} {p.type_service ? `(${p.type_service})` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="designation">Désignation</Label>
                                    <Input
                                        id="designation"
                                        value={data.designation}
                                        onChange={(e) => setData('designation', e.target.value)}
                                    />
                                    {errors.designation && <p className="text-sm text-destructive">{errors.designation}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="quantite">Quantité</Label>
                                        <Input
                                            id="quantite"
                                            type="number"
                                            min={1}
                                            value={data.quantite}
                                            onChange={(e) => setData('quantite', Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="prix_unitaire">Prix unitaire (FCFA)</Label>
                                        <Input
                                            id="prix_unitaire"
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={data.prix_unitaire}
                                            onChange={(e) => setData('prix_unitaire', e.target.value)}
                                        />
                                        {errors.prix_unitaire && <p className="text-sm text-destructive">{errors.prix_unitaire}</p>}
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Enregistrement...' : 'Créer'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <DataTable
                    columns={columns}
                    data={demandes}
                    searchPlaceholder="Rechercher une désignation, un partenaire..."
                    toolbar={<ExportDialog exportUrl={DemandeServiceController.export().url} />}
                />
            </div>
        </>
    );
}

DemandesServiceIndex.layout = {
    breadcrumbs: [{ title: 'Demandes de service', href: DemandeServiceController.index() }],
};
