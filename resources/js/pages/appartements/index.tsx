import { Head, router, useForm } from '@inertiajs/react';
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import AppartementController from '@/actions/App/Http/Controllers/AppartementController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { equipementIcon } from '@/lib/equipement-icons';

type StatutEntretien = 'propre' | 'a_nettoyer' | 'en_maintenance';
type TypeLogement = 'studio' | 't2' | 't3' | 't4_plus' | 'penthouse' | 'villa' | '';

type EquipementResume = {
    id: number;
    nom: string;
    icone: string | null;
};

type TypeReduction = 'pourcentage' | 'montant_fixe';

type ReductionResume = {
    id: number;
    nuits_min: number;
    type: TypeReduction;
    valeur: string;
};

type ReductionRow = {
    nuits_min: number | string;
    type: TypeReduction;
    valeur: number | string;
};

const emptyReductionRow: ReductionRow = { nuits_min: '', type: 'pourcentage', valeur: '' };

type Appartement = {
    id: number;
    numero: string;
    capacite: number;
    prix_nuit: string;
    statut_entretien: StatutEntretien;
    titre: string | null;
    description: string | null;
    adresse: string | null;
    type: TypeLogement | null;
    photos: string[] | null;
    chambres: number | null;
    salles_de_bain: number | null;
    surface_m2: string | null;
    equipements: EquipementResume[];
    reductions: ReductionResume[];
};

type AppartementFormValues = {
    numero: string;
    capacite: number | string;
    prix_nuit: number | string;
    statut_entretien: StatutEntretien;
    titre: string;
    description: string;
    adresse: string;
    type: TypeLogement;
    chambres: number | string;
    salles_de_bain: number | string;
    surface_m2: number | string;
    photos: File[];
    equipements: number[];
    reductions: ReductionRow[];
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

const TYPE_LABELS: Record<Exclude<TypeLogement, ''>, string> = {
    studio: 'Studio',
    t2: 'T2',
    t3: 'T3',
    t4_plus: 'T4+',
    penthouse: 'Penthouse',
    villa: 'Villa',
};

const emptyForm: AppartementFormValues = {
    numero: '',
    capacite: '',
    prix_nuit: '',
    statut_entretien: 'propre',
    titre: '',
    description: '',
    adresse: '',
    type: '',
    chambres: '',
    salles_de_bain: '',
    surface_m2: '',
    photos: [],
    equipements: [],
    reductions: [],
};

function AppartementFormFields({
    form,
    onSubmit,
    submitLabel,
    equipementsCatalogue,
    photosExistantes,
}: {
    form: ReturnType<typeof useForm<AppartementFormValues>>;
    onSubmit: (e: FormEvent) => void;
    submitLabel: string;
    equipementsCatalogue?: EquipementResume[];
    photosExistantes?: string[];
}) {
    const { data, setData, errors, processing } = form;

    // Aperçu des fichiers tout juste sélectionnés (avant envoi) — photosExistantes ne
    // reflète que ce qui est déjà enregistré côté serveur, donc sans ceci les photos
    // qu'on vient de choisir restaient invisibles jusqu'à l'enregistrement puis la
    // réouverture du formulaire. Générées dans un effet (pas un useMemo) : React ne
    // garantit pas qu'un rendu commencé soit committé, alors qu'un effet ne s'exécute
    // que pour un rendu réellement affiché — sans quoi une URL objet pourrait être
    // créée sans jamais être révoquée.
    const [previsualisations, setPrevisualisations] = useState<string[]>([]);

    useEffect(() => {
        const urls = data.photos.map((file) => URL.createObjectURL(file));
        setPrevisualisations(urls);

        return () => urls.forEach((url) => URL.revokeObjectURL(url));
    }, [data.photos]);

    function toggleEquipement(id: number, checked: boolean) {
        setData(
            'equipements',
            checked ? [...data.equipements, id] : data.equipements.filter((e) => e !== id),
        );
    }

    function addReduction() {
        setData('reductions', [...data.reductions, { ...emptyReductionRow }]);
    }

    function updateReduction(index: number, patch: Partial<ReductionRow>) {
        setData(
            'reductions',
            data.reductions.map((r, i) => (i === index ? { ...r, ...patch } : r)),
        );
    }

    function removeReduction(index: number) {
        setData('reductions', data.reductions.filter((_, i) => i !== index));
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="numero">Numéro</Label>
                    <Input id="numero" value={data.numero} onChange={(e) => setData('numero', e.target.value)} />
                    {errors.numero && <p className="text-sm text-destructive">{errors.numero}</p>}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="titre">Titre (portail)</Label>
                    <Input
                        id="titre"
                        placeholder="Suite Haussmann"
                        value={data.titre}
                        onChange={(e) => setData('titre', e.target.value)}
                    />
                    {errors.titre && <p className="text-sm text-destructive">{errors.titre}</p>}
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="adresse">Adresse</Label>
                <Input id="adresse" value={data.adresse} onChange={(e) => setData('adresse', e.target.value)} />
                {errors.adresse && <p className="text-sm text-destructive">{errors.adresse}</p>}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                    id="description"
                    rows={3}
                    className="border-input flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                />
                {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
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

            <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="chambres">Chambres</Label>
                    <Input
                        id="chambres"
                        type="number"
                        min={0}
                        value={data.chambres}
                        onChange={(e) => setData('chambres', e.target.value)}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="salles_de_bain">Salles de bain</Label>
                    <Input
                        id="salles_de_bain"
                        type="number"
                        min={0}
                        value={data.salles_de_bain}
                        onChange={(e) => setData('salles_de_bain', e.target.value)}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="surface_m2">Surface (m²)</Label>
                    <Input
                        id="surface_m2"
                        type="number"
                        min={0}
                        step="0.01"
                        value={data.surface_m2}
                        onChange={(e) => setData('surface_m2', e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="type">Type de logement</Label>
                    <Select value={data.type} onValueChange={(value) => setData('type', value as TypeLogement)}>
                        <SelectTrigger id="type">
                            <SelectValue placeholder="Non défini" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(TYPE_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
            </div>

            <div className="grid gap-2">
                <Label htmlFor="photos">Photos</Label>
                {photosExistantes && photosExistantes.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {photosExistantes.map((url) => (
                            <img key={url} src={url} alt="" className="h-16 w-16 rounded object-cover" />
                        ))}
                    </div>
                )}
                <Input
                    id="photos"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setData('photos', e.target.files ? Array.from(e.target.files) : [])}
                />
                {previsualisations.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {previsualisations.map((url) => (
                            <img key={url} src={url} alt="" className="h-16 w-16 rounded border-2 border-primary object-cover" />
                        ))}
                    </div>
                )}
                <p className="text-xs text-muted-foreground">
                    Les nouvelles photos s'ajoutent aux existantes (pas de suppression individuelle pour l'instant).
                </p>
                {errors.photos && <p className="text-sm text-destructive">{errors.photos}</p>}
            </div>

            {equipementsCatalogue && (
                <div className="grid gap-2">
                    <Label>Équipements</Label>
                    <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
                        {equipementsCatalogue.map((item) => {
                            const Icon = equipementIcon(item.icone);
                            return (
                                <label key={item.id} className="flex items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={data.equipements.includes(item.id)}
                                        onCheckedChange={(checked) => toggleEquipement(item.id, checked === true)}
                                    />
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                    {item.nom}
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}

            {equipementsCatalogue && (
                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label>Réductions par durée de séjour</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addReduction}>
                            Ajouter un palier
                        </Button>
                    </div>
                    <div className="space-y-2 rounded-md border p-3">
                        {data.reductions.length === 0 && (
                            <p className="text-xs text-muted-foreground">Aucun palier — le prix plein s'applique quelle que soit la durée.</p>
                        )}
                        {data.reductions.map((reduction, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                    <Input
                                        type="number"
                                        min={1}
                                        placeholder="Nuits"
                                        className="w-20"
                                        value={reduction.nuits_min}
                                        onChange={(e) => updateReduction(index, { nuits_min: e.target.value })}
                                    />
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">nuits et +</span>
                                </div>
                                <Select
                                    value={reduction.type}
                                    onValueChange={(value) => updateReduction(index, { type: value as TypeReduction })}
                                >
                                    <SelectTrigger className="w-36">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pourcentage">Pourcentage</SelectItem>
                                        <SelectItem value="montant_fixe">Montant fixe</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    type="number"
                                    min={0}
                                    max={reduction.type === 'pourcentage' ? 100 : undefined}
                                    step="0.01"
                                    placeholder={reduction.type === 'pourcentage' ? '%' : 'FCFA'}
                                    className="w-28"
                                    value={reduction.valeur}
                                    onChange={(e) => updateReduction(index, { valeur: e.target.value })}
                                />
                                <Button type="button" variant="ghost" size="sm" onClick={() => removeReduction(index)}>
                                    Retirer
                                </Button>
                            </div>
                        ))}
                        {errors.reductions && <p className="text-sm text-destructive">{errors.reductions}</p>}
                    </div>
                </div>
            )}

            <DialogFooter>
                <Button type="submit" disabled={processing}>
                    {processing ? 'Enregistrement...' : submitLabel}
                </Button>
            </DialogFooter>
        </form>
    );
}

export default function AppartementsIndex({
    appartements,
    equipementsCatalogue,
}: {
    appartements: Appartement[];
    equipementsCatalogue: EquipementResume[];
}) {
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
            titre: appartement.titre ?? '',
            description: appartement.description ?? '',
            adresse: appartement.adresse ?? '',
            type: appartement.type ?? '',
            chambres: appartement.chambres ?? '',
            salles_de_bain: appartement.salles_de_bain ?? '',
            surface_m2: appartement.surface_m2 ?? '',
            photos: [],
            equipements: appartement.equipements.map((e) => {
                const modele = equipementsCatalogue.find((c) => c.nom === e.nom);
                return modele?.id ?? e.id;
            }),
            reductions: appartement.reductions.map((r) => ({
                nuits_min: r.nuits_min,
                type: r.type,
                valeur: r.valeur,
            })),
        });
        setEditing(appartement);
    }

    function submitCreate(e: FormEvent) {
        e.preventDefault();
        createForm.post(AppartementController.store().url, {
            preserveScroll: true,
            forceFormData: true,
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
            forceFormData: true,
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
                            <Button>
                                <Plus /> Ajouter un appartement
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto">
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
                                                    <Pencil /> Modifier
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => destroy(appartement)}>
                                                    <Trash2 className="text-red-500" />
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
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Modifier {editing?.numero}</DialogTitle>
                    </DialogHeader>
                    <AppartementFormFields
                        form={editForm}
                        onSubmit={submitEdit}
                        submitLabel="Enregistrer"
                        equipementsCatalogue={equipementsCatalogue}
                        photosExistantes={editing?.photos ?? []}
                    />
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
