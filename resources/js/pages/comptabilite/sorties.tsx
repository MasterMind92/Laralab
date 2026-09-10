import { Head, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import ComptabiliteController from '@/actions/App/Http/Controllers/ComptabiliteController';
import { DataTable } from '@/components/data-table/data-table';
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
import {
    CATEGORIE_LABELS,
    fmtDate,
    fmtMontant,
    ORIGINE_SORTIE_LABELS,
    OrigineSortieBadge,
} from './shared';
import type {
    CategorieCharge,
    Employe,
    OrigineSortie,
    SortieRow,
} from './shared';

/**
 * Sorties — le livre des décaissements (Phase 06, étape B-bis).
 *
 * **Ce n'est pas le journal des dépenses, et c'est tout l'intérêt.** Une dépense est une
 * CHARGE : les immobilisations en sont délibérément absentes. Un écran de trésorerie
 * alimenté par cette table afficherait 60 000 FCFA sortis quand 560 000 ont réellement
 * quitté la caisse.
 *
 * La liste additionne donc deux gisements DISJOINTS :
 *   - les règlements de factures fournisseur, pour leur montant TOTAL ;
 *   - les dépenses de saisie directe, celles qui n'ont jamais eu de facture.
 *
 * Les dépenses issues d'une facture sont exclues côté serveur : leur montant est déjà dans
 * le total de cette facture. C'est cette exclusion qui empêche le double comptage.
 *
 * Une ligne par MOUVEMENT, pas par ligne comptable : un livre de caisse suit l'argent, pas
 * les écritures. La ventilation charge / immobilisation vit dans la synthèse, où elle
 * réconcilie cet écran avec les états financiers.
 */
const TOUS = '__tous__';
const AUCUN = '__aucun__';

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

export default function Sorties({
    sorties,
    employes,
    synthese,
    filters,
}: {
    sorties: SortieRow[];
    employes: Employe[];
    synthese: { total: number; charges: number; immobilise: number };
    filters: {
        origine?: OrigineSortie | null;
        du?: string | null;
        au?: string | null;
    };
}) {
    const [origine, setOrigine] = useState<string>(filters.origine ?? TOUS);
    const [du, setDu] = useState(filters.du ?? '');
    const [au, setAu] = useState(filters.au ?? '');

    const [ouvert, setOuvert] = useState(false);
    const [enEdition, setEnEdition] = useState<SortieRow | null>(null);
    const [form, setForm] = useState<Formulaire>(VIDE);

    function filtrer(e: FormEvent) {
        e.preventDefault();
        router.get(
            ComptabiliteController.sorties().url,
            {
                origine: origine === TOUS ? undefined : origine,
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

    function ouvrirEdition(sortie: SortieRow) {
        setEnEdition(sortie);
        setForm({
            libelle: sortie.libelle,
            montant: String(sortie.montant),
            date_depense: sortie.date ?? '',
            categorie: sortie.categorie ?? 'autres',
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

        if (enEdition?.depense_id) {
            router.put(
                ComptabiliteController.updateDepense(enEdition.depense_id).url,
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

    function supprimer(sortie: SortieRow) {
        if (!sortie.depense_id) {
            return;
        }

        if (!confirm(`Supprimer « ${sortie.libelle} » ?`)) {
            return;
        }

        router.delete(
            ComptabiliteController.destroyDepense(sortie.depense_id).url,
            { preserveScroll: true },
        );
    }

    const columns: ColumnDef<SortieRow>[] = [
        {
            id: 'date',
            header: 'Décaissée le',
            accessorFn: (s) => s.date ?? '',
            cell: ({ row }) => (
                <span className="text-sm">{fmtDate(row.original.date)}</span>
            ),
        },
        {
            accessorKey: 'libelle',
            header: 'Mouvement',
            cell: ({ row }) => (
                <div className="space-y-0.5">
                    <p className="text-sm font-medium">
                        {row.original.libelle}
                    </p>
                    {row.original.tiers && (
                        <p className="text-xs text-muted-foreground">
                            {row.original.tiers}
                        </p>
                    )}
                    {row.original.categorie && (
                        <p className="text-xs text-muted-foreground">
                            {CATEGORIE_LABELS[row.original.categorie]}
                        </p>
                    )}
                </div>
            ),
        },
        {
            id: 'origine',
            header: 'Origine',
            accessorFn: (s) => ORIGINE_SORTIE_LABELS[s.origine],
            cell: ({ row }) => (
                <OrigineSortieBadge origine={row.original.origine} />
            ),
        },
        {
            id: 'mode',
            header: 'Mode',
            accessorFn: (s) => s.mode_paiement ?? '',
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground">
                    {row.original.mode_paiement ?? '—'}
                </span>
            ),
        },
        {
            id: 'montant',
            header: 'Montant',
            accessorFn: (s) => s.montant,
            cell: ({ row }) => (
                <div className="space-y-0.5">
                    <p className="text-sm font-medium tabular-nums">
                        {fmtMontant(row.original.montant)}
                    </p>
                    {row.original.montant_immobilise > 0 && (
                        <p className="text-xs text-muted-foreground tabular-nums">
                            dont {fmtMontant(row.original.montant_immobilise)}{' '}
                            immobilisés
                        </p>
                    )}
                </div>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const sortie = row.original;

                // Une sortie issue d'une facture n'est pas modifiable ici : elle est le
                // reflet d'un règlement. La corriger sans toucher la facture ferait
                // diverger les deux.
                if (sortie.origine === 'facture') {
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
                                onClick={() => ouvrirEdition(sortie)}
                            >
                                Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => supprimer(sortie)}>
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
            <Head title="Sorties" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Sorties</h1>
                    <p className="text-sm text-muted-foreground">
                        {fmtMontant(synthese.total)} décaissés sur{' '}
                        {sorties.length} mouvement
                        {sorties.length > 1 ? 's' : ''}
                    </p>
                </div>

                {/* La ventilation qui réconcilie cet écran avec les états financiers :
                    seules les charges y pèsent sur la marge. */}
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-md border p-4">
                        <p className="text-sm font-medium">Total décaissé</p>
                        <p className="text-2xl font-semibold tabular-nums">
                            {fmtMontant(synthese.total)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Ce qui a réellement quitté la caisse
                        </p>
                    </div>
                    <div className="rounded-md border p-4">
                        <p className="text-sm font-medium">dont charges</p>
                        <p className="text-2xl font-semibold tabular-nums">
                            {fmtMontant(synthese.charges)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Ce qui pèse sur le résultat
                        </p>
                    </div>
                    <div className="rounded-md border p-4">
                        <p className="text-sm font-medium">
                            dont immobilisations
                        </p>
                        <p className="text-2xl font-semibold tabular-nums">
                            {fmtMontant(synthese.immobilise)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Biens durables, portés à l'actif
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={filtrer}
                    className="grid grid-cols-2 gap-3 rounded-md border p-3 md:grid-cols-4 md:items-end"
                >
                    <div className="grid gap-1.5">
                        <Label htmlFor="f-origine">Origine</Label>
                        <Select value={origine} onValueChange={setOrigine}>
                            <SelectTrigger id="f-origine">
                                <SelectValue placeholder="Toutes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TOUS}>Toutes</SelectItem>
                                {Object.entries(ORIGINE_SORTIE_LABELS).map(
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
                    data={sorties}
                    searchPlaceholder="Rechercher un décaissement..."
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
                                    ? 'Modifier la sortie'
                                    : 'Sortie saisie directement'}
                            </DialogTitle>
                        </DialogHeader>

                        {!enEdition && (
                            <p className="text-sm text-muted-foreground">
                                Pour ce qui n'a jamais eu de facture fournisseur
                                : petite caisse, note de frais, salaires. Ce qui
                                vient d'une facture s'inscrit tout seul à son
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
                            <p className="text-xs text-muted-foreground">
                                Une saisie directe est toujours une charge : on
                                n'immobilise pas sans facture.
                            </p>
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

Sorties.layout = {
    breadcrumbs: [
        { title: 'Comptabilité', href: '/admin/comptabilite' },
        { title: 'Sorties', href: ComptabiliteController.sorties() },
    ],
};
