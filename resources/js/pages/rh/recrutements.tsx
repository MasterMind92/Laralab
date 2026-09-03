import { Head, Link, router, useForm } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, X } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import RecrutementController from '@/actions/App/Http/Controllers/RecrutementController';
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

type Statut = 'brouillon' | 'en_attente_validation' | 'validee' | 'rejetee' | 'clos';

type RecrutementResume = {
    id: number;
    poste: string;
    departement: string | null;
    statut: Statut;
    priorite: 'basse' | 'normale' | 'haute';
    candidats_count: number;
    motif_rejet: string | null;
};

type Employe = { id: number; nom: string; prenom: string };

const STATUT_LABELS: Record<Statut, string> = {
    brouillon: 'Brouillon',
    en_attente_validation: 'En attente de validation',
    validee: 'Validée',
    rejetee: 'Rejetée',
    clos: 'Clos',
};

const STATUT_VARIANTS: Record<Statut, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    brouillon: 'outline',
    en_attente_validation: 'secondary',
    validee: 'default',
    rejetee: 'destructive',
    clos: 'secondary',
};

const emptyForm = {
    poste: '',
    departement: '',
    responsable_id: '',
    profil_recherche: '',
    description: '',
    competences: [] as string[],
    nombre_postes: '1',
    type_contrat_propose: '',
    date_souhaitee: '',
    budget_min: '',
    budget_max: '',
    priorite: 'normale',
    motif: '',
    date_limite_candidature: '',
    lieu: '',
};

export default function Recrutements({ recrutements, employes }: { recrutements: RecrutementResume[]; employes: Employe[] }) {
    const [createOpen, setCreateOpen] = useState(false);
    const [rejeter, setRejeter] = useState<RecrutementResume | null>(null);
    const [competenceInput, setCompetenceInput] = useState('');

    const form = useForm(emptyForm);
    const rejetForm = useForm({ motif_rejet: '' });

    function submit(e: FormEvent) {
        e.preventDefault();
        form.post(RecrutementController.store().url, {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setCreateOpen(false);
            },
        });
    }

    function ajouterCompetence() {
        const v = competenceInput.trim();
        if (v && !form.data.competences.includes(v)) {
            form.setData('competences', [...form.data.competences, v]);
        }
        setCompetenceInput('');
    }

    function submitRejet(e: FormEvent) {
        e.preventDefault();
        if (!rejeter) return;
        rejetForm.patch(RecrutementController.rejeter(rejeter.id).url, {
            preserveScroll: true,
            onSuccess: () => {
                rejetForm.reset();
                setRejeter(null);
            },
        });
    }

    const columns: ColumnDef<RecrutementResume>[] = [
        {
            id: 'poste',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Poste <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <Link href={RecrutementController.show(row.original.id).url} className="font-medium hover:underline">
                    {row.original.poste}
                </Link>
            ),
        },
        { accessorKey: 'departement', header: 'Département', cell: ({ row }) => row.original.departement ?? '—' },
        { accessorKey: 'priorite', header: 'Priorité' },
        { accessorKey: 'candidats_count', header: 'Candidats' },
        {
            accessorKey: 'statut',
            header: 'Statut',
            cell: ({ row }) => <Badge variant={STATUT_VARIANTS[row.original.statut]}>{STATUT_LABELS[row.original.statut]}</Badge>,
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const r = row.original;
                return (
                    <div className="flex justify-end gap-2">
                        {r.statut === 'brouillon' && (
                            <Button size="sm" onClick={() => router.patch(RecrutementController.soumettre(r.id).url, {}, { preserveScroll: true })}>
                                Soumettre
                            </Button>
                        )}
                        {r.statut === 'en_attente_validation' && (
                            <>
                                <Button variant="outline" size="sm" onClick={() => setRejeter(r)}>
                                    Rejeter
                                </Button>
                                <Button size="sm" onClick={() => router.patch(RecrutementController.valider(r.id).url, {}, { preserveScroll: true })}>
                                    Valider
                                </Button>
                            </>
                        )}
                        <Button variant="outline" size="sm" asChild>
                            <Link href={RecrutementController.show(r.id).url}>Détail</Link>
                        </Button>
                    </div>
                );
            },
        },
    ];

    return (
        <>
            <Head title="Recrutements" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Recrutements</h1>
                    <div className="flex gap-2">
                        <ExportDialog exportUrl={RecrutementController.export().url} />
                        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) form.reset(); }}>
                            <DialogTrigger asChild>
                                <Button>Nouvelle demande</Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Demande de recrutement</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={submit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="poste">Poste</Label>
                                            <Input id="poste" value={form.data.poste} onChange={(e) => form.setData('poste', e.target.value)} />
                                            {form.errors.poste && <p className="text-sm text-destructive">{form.errors.poste}</p>}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="departement">Département</Label>
                                            <Input id="departement" value={form.data.departement} onChange={(e) => form.setData('departement', e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="responsable_id">Responsable</Label>
                                        <Select value={form.data.responsable_id} onValueChange={(v) => form.setData('responsable_id', v)}>
                                            <SelectTrigger id="responsable_id">
                                                <SelectValue placeholder="Sélectionner" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {employes.map((e) => (
                                                    <SelectItem key={e.id} value={String(e.id)}>{e.nom} {e.prenom}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="profil_recherche">Profil recherché</Label>
                                        <textarea id="profil_recherche" rows={2} className="border-input flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none" value={form.data.profil_recherche} onChange={(e) => form.setData('profil_recherche', e.target.value)} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="description">Description (publiée sur le portail)</Label>
                                        <textarea id="description" rows={3} className="border-input flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none" value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Compétences</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={competenceInput}
                                                onChange={(e) => setCompetenceInput(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); ajouterCompetence(); } }}
                                                placeholder="Ex. React, TypeScript..."
                                            />
                                            <Button type="button" variant="outline" onClick={ajouterCompetence}>Ajouter</Button>
                                        </div>
                                        {form.data.competences.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                {form.data.competences.map((c) => (
                                                    <Badge key={c} variant="secondary" className="gap-1">
                                                        {c}
                                                        <button type="button" onClick={() => form.setData('competences', form.data.competences.filter((x) => x !== c))}>
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="nombre_postes">Nombre de postes</Label>
                                            <Input id="nombre_postes" type="number" min={1} value={form.data.nombre_postes} onChange={(e) => form.setData('nombre_postes', e.target.value)} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="type_contrat_propose">Type de contrat</Label>
                                            <Select value={form.data.type_contrat_propose} onValueChange={(v) => form.setData('type_contrat_propose', v)}>
                                                <SelectTrigger id="type_contrat_propose">
                                                    <SelectValue placeholder="—" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="cdi">CDI</SelectItem>
                                                    <SelectItem value="cdd">CDD</SelectItem>
                                                    <SelectItem value="stage">Stage</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="priorite">Priorité</Label>
                                            <Select value={form.data.priorite} onValueChange={(v) => form.setData('priorite', v)}>
                                                <SelectTrigger id="priorite">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="basse">Basse</SelectItem>
                                                    <SelectItem value="normale">Normale</SelectItem>
                                                    <SelectItem value="haute">Haute</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="budget_min">Budget min (FCFA)</Label>
                                            <Input id="budget_min" type="number" min={0} value={form.data.budget_min} onChange={(e) => form.setData('budget_min', e.target.value)} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="budget_max">Budget max (FCFA)</Label>
                                            <Input id="budget_max" type="number" min={0} value={form.data.budget_max} onChange={(e) => form.setData('budget_max', e.target.value)} />
                                            {form.errors.budget_max && <p className="text-sm text-destructive">{form.errors.budget_max}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="motif">Motif</Label>
                                            <Select value={form.data.motif} onValueChange={(v) => form.setData('motif', v)}>
                                                <SelectTrigger id="motif">
                                                    <SelectValue placeholder="—" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="remplacement">Remplacement</SelectItem>
                                                    <SelectItem value="creation_poste">Création de poste</SelectItem>
                                                    <SelectItem value="renforcement_equipe">Renforcement d'équipe</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="lieu">Lieu</Label>
                                            <Input id="lieu" value={form.data.lieu} onChange={(e) => form.setData('lieu', e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="date_souhaitee">Date souhaitée</Label>
                                            <Input id="date_souhaitee" type="date" value={form.data.date_souhaitee} onChange={(e) => form.setData('date_souhaitee', e.target.value)} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="date_limite_candidature">Date limite de candidature</Label>
                                            <Input id="date_limite_candidature" type="date" value={form.data.date_limite_candidature} onChange={(e) => form.setData('date_limite_candidature', e.target.value)} />
                                        </div>
                                    </div>

                                    <DialogFooter>
                                        <Button type="submit" disabled={form.processing}>
                                            {form.processing ? 'Enregistrement...' : 'Créer (brouillon)'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <DataTable columns={columns} data={recrutements} searchPlaceholder="Rechercher un recrutement..." />
            </div>

            <Dialog open={rejeter !== null} onOpenChange={(open) => !open && setRejeter(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rejeter — {rejeter?.poste}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitRejet} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="motif_rejet">Motif du rejet</Label>
                            <textarea id="motif_rejet" rows={3} className="border-input flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none" value={rejetForm.data.motif_rejet} onChange={(e) => rejetForm.setData('motif_rejet', e.target.value)} />
                            {rejetForm.errors.motif_rejet && <p className="text-sm text-destructive">{rejetForm.errors.motif_rejet}</p>}
                        </div>
                        <DialogFooter>
                            <Button type="submit" variant="destructive" disabled={rejetForm.processing}>
                                {rejetForm.processing ? 'Envoi...' : 'Rejeter'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
