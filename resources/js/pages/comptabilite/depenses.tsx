import { Head, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import ComptabiliteController from '@/actions/App/Http/Controllers/ComptabiliteController';
import { DataTable } from '@/components/data-table/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { CATEGORIE_LABELS, fmtDate, fmtMontant } from './shared';
import type { CategorieCharge, Employe } from './shared';

/**
 * Dépenses — le journal des charges (Phase 06, étape B).
 *
 * Deux origines, et la distinction est visible sur chaque ligne : ce qui vient du
 * règlement d'une facture fournisseur, et ce qui a été saisi à la main pour ce qui n'a
 * jamais eu de facture (petite caisse, note de frais).
 *
 * Une dépense issue d'une facture n'est ni modifiable ni supprimable ici : elle est le
 * reflet d'une écriture. La corriger sans toucher la facture ferait diverger les deux, et
 * le total du mois ne correspondrait plus à ce qui a été réglé.
 *
 * Ce que cet écran ne montre PAS : les immobilisations. Un climatiseur payé ce mois-ci
 * n'est pas une charge du mois — il est à l'actif. C'est toute la raison d'être du champ
 * `nature` sur les lignes de facture.
 */
const TOUS = '__tous__';
const AUCUN = '__aucun__';

type DepenseRow = {
    id: number;
    libelle: string;
    montant: number;
    date_depense: string | null;
    categorie: CategorieCharge;
    saisie_directe: boolean;
    valideur: string | null;
    origine: { reference: string | null; fournisseur: string | null } | null;
};

type Formulaire = {
    libelle: string;
    montant: string;
    date_depense: string;
    categorie: CategorieCharge;
    valideur_id: string;
};

const VIDE: Formulaire = {
    libelle: '',
    montant: '0',
    date_depense: '',
    categorie: 'autres',
    valideur_id: AUCUN,
};

export default function Depenses({
    depenses,
    employes,
    total,
    filters,
}: {
    depenses: DepenseRow[];
    employes: Employe[];
    total: number;
    filters: {
        categorie?: CategorieCharge | null;
        du?: string | null;
        au?: string | null;
    };
}) {
    const [categorie, setCategorie] = useState<string>(
        filters.categorie ?? TOUS,
    );
    const [du, setDu] = useState(filters.du ?? '');
    const [au, setAu] = useState(filters.au ?? '');

    const [ouvert, setOuvert] = useState(false);
    const [enEdition, setEnEdition] = useState<DepenseRow | null>(null);
    const [form, setForm] = useState<Formulaire>(VIDE);

    function filtrer(e: FormEvent) {
        e.preventDefault();
        router.get(
            ComptabiliteController.depenses().url,
            {
                categorie: categorie === TOUS ? undefined : categorie,
                du: du || undefined,
                au: au || undefined,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    function ouvrirCreation() {
        setEnEdition(null);
        setForm({
            ...VIDE,
            date_depense: new Date().toISOString().slice(0, 10),
        });
        setOuvert(true);
    }

    function ouvrirEdition(depense: DepenseRow) {
        setEnEdition(depense);
        setForm({
            libelle: depense.libelle,
            montant: String(depense.montant),
            date_depense: depense.date_depense ?? '',
            categorie: depense.categorie,
            valideur_id: AUCUN,
        });
        setOuvert(true);
    }

    function enregistrer(e: FormEvent) {
        e.preventDefault();

        const charge = {
            libelle: form.libelle,
            montant: Number(form.montant),
            date_depense: form.date_depense,
            categorie: form.categorie,
            valideur_id:
                form.valideur_id === AUCUN ? null : Number(form.valideur_id),
        };

        const options = {
            preserveScroll: true,
            onSuccess: () => setOuvert(false),
        };

        if (enEdition) {
            router.put(
                ComptabiliteController.updateDepense(enEdition.id).url,
                charge,
                options,
            );
        } else {
            router.post(
                ComptabiliteController.storeDepense().url,
                charge,
                options,
            );
        }
    }

    function supprimer(depense: DepenseRow) {
        if (!confirm(`Supprimer « ${depense.libelle} » ?`)) {
            return;
        }

        router.delete(ComptabiliteController.destroyDepense(depense.id).url, {
            preserveScroll: true,
        });
    }

    const columns: ColumnDef<DepenseRow>[] = [
        {
            accessorKey: 'libelle',
            header: 'Charge',
            cell: ({ row }) => (
                <div className="space-y-0.5">
                    <p className="text-sm font-medium">
                        {row.original.libelle}
                    </p>
                    {row.original.origine && (
                        <p className="text-xs text-muted-foreground">
                            {row.original.origine.fournisseur ??
                                'fournisseur inconnu'}
                            {row.original.origine.reference &&
                                ` · ${row.original.origine.reference}`}
                        </p>
                    )}
                </div>
            ),
        },
        {
            id: 'categorie',
            header: 'Famille',
            accessorFn: (d) => CATEGORIE_LABELS[d.categorie],
            cell: ({ row }) => (
                <span className="text-xs">
                    {CATEGORIE_LABELS[row.original.categorie]}
                </span>
            ),
        },
        {
            id: 'origine',
            header: 'Origine',
            accessorFn: (d) => (d.saisie_directe ? 'Saisie' : 'Facture'),
            cell: ({ row }) => (
                <Badge
                    variant={
                        row.original.saisie_directe ? 'outline' : 'secondary'
                    }
                >
                    {row.original.saisie_directe
                        ? 'Saisie directe'
                        : 'Facture fournisseur'}
                </Badge>
            ),
        },
        {
            id: 'montant',
            header: 'Montant',
            accessorFn: (d) => d.montant,
            cell: ({ row }) => (
                <span className="text-sm tabular-nums">
                    {fmtMontant(row.original.montant)}
                </span>
            ),
        },
        {
            id: 'date',
            header: 'Décaissée le',
            accessorFn: (d) => d.date_depense ?? '',
            cell: ({ row }) => (
                <span className="text-xs">
                    {fmtDate(row.original.date_depense)}
                </span>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const depense = row.original;

                if (!depense.saisie_directe) {
                    return (
                        <span className="text-xs text-muted-foreground">
                            Voir la facture
                        </span>
                    );
                }

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
                            <DropdownMenuItem
                                onClick={() => ouvrirEdition(depense)}
                            >
                                Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => supprimer(depense)}
                            >
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
            <Head title="Dépenses" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Dépenses</h1>
                    <p className="text-sm text-muted-foreground">
                        {depenses.length} charge
                        {depenses.length > 1 ? 's' : ''} · {fmtMontant(total)}{' '}
                        sur la période affichée
                    </p>
                </div>

                <form
                    onSubmit={filtrer}
                    className="grid grid-cols-2 gap-3 rounded-md border p-3 md:grid-cols-4 md:items-end"
                >
                    <div className="grid gap-1.5">
                        <Label htmlFor="f-categorie">Famille</Label>
                        <Select value={categorie} onValueChange={setCategorie}>
                            <SelectTrigger id="f-categorie">
                                <SelectValue placeholder="Toutes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TOUS}>Toutes</SelectItem>
                                {Object.entries(CATEGORIE_LABELS).map(
                                    ([cle, libelle]) => (
                                        <SelectItem key={cle} value={cle}>
                                            {libelle}
                                        </SelectItem>
                                    ),
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="f-du">Du</Label>
                        <Input
                            id="f-du"
                            type="date"
                            value={du}
                            onChange={(e) => setDu(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="f-au">Au</Label>
                        <Input
                            id="f-au"
                            type="date"
                            value={au}
                            onChange={(e) => setAu(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit">Filtrer</Button>
                    </div>
                </form>

                <DataTable
                    columns={columns}
                    data={depenses}
                    searchPlaceholder="Rechercher une charge..."
                    toolbar={
                        <Button onClick={ouvrirCreation}>
                            <Plus /> Saisie directe
                        </Button>
                    }
                />
            </div>

            <Dialog open={ouvert} onOpenChange={setOuvert}>
                <DialogContent>
                    <form onSubmit={enregistrer} className="grid gap-4">
                        <DialogHeader>
                            <DialogTitle>
                                {enEdition
                                    ? 'Modifier la charge'
                                    : 'Charge saisie directement'}
                            </DialogTitle>
                        </DialogHeader>

                        {!enEdition && (
                            <p className="text-sm text-muted-foreground">
                                Pour ce qui n'a jamais eu de facture fournisseur
                                : petite caisse, note de frais. Ce qui vient
                                d'une facture s'inscrit tout seul à son
                                règlement.
                            </p>
                        )}

                        <div className="grid gap-1.5">
                            <Label htmlFor="libelle">Libellé</Label>
                            <Input
                                id="libelle"
                                required
                                maxLength={255}
                                value={form.libelle}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        libelle: e.target.value,
                                    })
                                }
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="montant">Montant</Label>
                                <Input
                                    id="montant"
                                    type="number"
                                    min={0}
                                    required
                                    value={form.montant}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            montant: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="date">Décaissée le</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    required
                                    value={form.date_depense}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            date_depense: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="categorie">Famille de charge</Label>
                            <Select
                                value={form.categorie}
                                onValueChange={(v) =>
                                    setForm({
                                        ...form,
                                        categorie: v as CategorieCharge,
                                    })
                                }
                            >
                                <SelectTrigger id="categorie">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(CATEGORIE_LABELS).map(
                                        ([cle, libelle]) => (
                                            <SelectItem key={cle} value={cle}>
                                                {libelle}
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="valideur">Validée par</Label>
                            <Select
                                value={form.valideur_id}
                                onValueChange={(v) =>
                                    setForm({ ...form, valideur_id: v })
                                }
                            >
                                <SelectTrigger id="valideur">
                                    <SelectValue placeholder="Personne" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={AUCUN}>
                                        Personne
                                    </SelectItem>
                                    {employes.map((e) => (
                                        <SelectItem
                                            key={e.id}
                                            value={String(e.id)}
                                        >
                                            {e.prenom} {e.nom}
                                            {e.poste ? ` · ${e.poste}` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOuvert(false)}
                            >
                                Annuler
                            </Button>
                            <Button type="submit">Enregistrer</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

Depenses.layout = {
    breadcrumbs: [
        { title: 'Comptabilité', href: '/admin/comptabilite' },
        { title: 'Dépenses', href: ComptabiliteController.depenses() },
    ],
};
