import { Head, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import LogistiqueController from '@/actions/App/Http/Controllers/LogistiqueController';
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
    fmtDate,
    nomComplet,
    PRIORITE_LABELS,
    PRIORITES,
    PrioriteBadge,
    STATUT_BESOIN_LABELS,
    STATUTS_BESOIN,
    StatutBesoinBadge,
} from './shared';
import type {
    AppartementRef,
    BesoinRow,
    Employe,
    PrioriteBesoin,
    StatutBesoin,
} from './shared';

/**
 * Expression de besoin (Phase 10, étape B) — premier écran de la chaîne.
 *
 * Le menu d'actions ne propose que les transitions renvoyées par le serveur : c'est
 * `Besoin::TRANSITIONS` qui décide, pas cette page. Un besoin refusé retourne en brouillon
 * pour être corrigé, plutôt que d'obliger le demandeur à en ressaisir un second.
 */
const TOUS = '__tous__';

type Filters = {
    statut?: StatutBesoin | null;
    priorite?: PrioriteBesoin | null;
};

type Formulaire = {
    demandeur_employe_id: string;
    appartement_id: string;
    designation: string;
    quantite: string;
    justification: string;
    priorite: PrioriteBesoin;
};

const VIDE: Formulaire = {
    demandeur_employe_id: TOUS,
    appartement_id: TOUS,
    designation: '',
    quantite: '1',
    justification: '',
    priorite: 'normale',
};

export default function Besoins({
    besoins,
    employes,
    appartements,
    filters,
}: {
    besoins: BesoinRow[];
    employes: Employe[];
    appartements: AppartementRef[];
    filters: Filters;
}) {
    const [statut, setStatut] = useState<string>(filters.statut ?? TOUS);
    const [priorite, setPriorite] = useState<string>(filters.priorite ?? TOUS);

    const [ouvert, setOuvert] = useState(false);
    const [enEdition, setEnEdition] = useState<BesoinRow | null>(null);
    const [form, setForm] = useState<Formulaire>(VIDE);

    const [refus, setRefus] = useState<BesoinRow | null>(null);
    const [motif, setMotif] = useState('');

    function filtrer(statutChoisi: string, prioriteChoisie: string) {
        setStatut(statutChoisi);
        setPriorite(prioriteChoisie);
        router.get(
            LogistiqueController.besoins().url,
            {
                statut: statutChoisi === TOUS ? undefined : statutChoisi,
                priorite:
                    prioriteChoisie === TOUS ? undefined : prioriteChoisie,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    function ouvrirCreation() {
        setEnEdition(null);
        setForm(VIDE);
        setOuvert(true);
    }

    function ouvrirEdition(besoin: BesoinRow) {
        setEnEdition(besoin);
        setForm({
            demandeur_employe_id: besoin.demandeur
                ? String(besoin.demandeur.id)
                : TOUS,
            appartement_id: besoin.appartement
                ? String(besoin.appartement.id)
                : TOUS,
            designation: besoin.designation,
            quantite: String(besoin.quantite),
            justification: besoin.justification ?? '',
            priorite: besoin.priorite,
        });
        setOuvert(true);
    }

    function enregistrer(e: FormEvent) {
        e.preventDefault();

        const charge = {
            demandeur_employe_id:
                form.demandeur_employe_id === TOUS
                    ? null
                    : Number(form.demandeur_employe_id),
            appartement_id:
                form.appartement_id === TOUS
                    ? null
                    : Number(form.appartement_id),
            designation: form.designation,
            quantite: Number(form.quantite),
            justification: form.justification || null,
            priorite: form.priorite,
        };

        const action = enEdition
            ? LogistiqueController.updateBesoin(enEdition.id)
            : LogistiqueController.storeBesoin();

        const options = {
            preserveScroll: true,
            onSuccess: () => setOuvert(false),
        };

        if (enEdition) {
            router.put(action.url, charge, options);
        } else {
            router.post(action.url, charge, options);
        }
    }

    function changerStatut(besoin: BesoinRow, cible: StatutBesoin) {
        // Le refus est la seule transition qui exige une saisie : on passe par une
        // boîte dédiée plutôt que d'accepter un refus sans explication.
        if (cible === 'refuse') {
            setMotif('');
            setRefus(besoin);

            return;
        }

        router.patch(
            LogistiqueController.changerStatutBesoin(besoin.id).url,
            { statut: cible },
            { preserveScroll: true },
        );
    }

    function confirmerRefus(e: FormEvent) {
        e.preventDefault();

        if (!refus) {
            return;
        }

        router.patch(
            LogistiqueController.changerStatutBesoin(refus.id).url,
            { statut: 'refuse', motif_refus: motif },
            { preserveScroll: true, onSuccess: () => setRefus(null) },
        );
    }

    function supprimer(besoin: BesoinRow) {
        if (!confirm(`Supprimer le besoin « ${besoin.designation} » ?`)) {
            return;
        }

        router.delete(LogistiqueController.destroyBesoin(besoin.id).url, {
            preserveScroll: true,
        });
    }

    const columns: ColumnDef<BesoinRow>[] = [
        {
            accessorKey: 'designation',
            header: 'Besoin',
            cell: ({ row }) => (
                <div className="space-y-0.5">
                    <p className="text-sm font-medium">
                        {row.original.designation}
                    </p>
                    {row.original.justification && (
                        <p className="max-w-md text-xs text-muted-foreground">
                            {row.original.justification}
                        </p>
                    )}
                    {row.original.statut === 'refuse' &&
                        row.original.motif_refus && (
                            <p className="max-w-md text-xs text-red-500">
                                Refus : {row.original.motif_refus}
                            </p>
                        )}
                </div>
            ),
        },
        {
            accessorKey: 'quantite',
            header: 'Qté',
            cell: ({ row }) => (
                <span className="text-sm tabular-nums">
                    {row.original.quantite}
                </span>
            ),
        },
        {
            id: 'priorite',
            header: 'Priorité',
            accessorFn: (b) => PRIORITE_LABELS[b.priorite],
            cell: ({ row }) => (
                <PrioriteBadge priorite={row.original.priorite} />
            ),
        },
        {
            id: 'statut',
            header: 'Statut',
            accessorFn: (b) => STATUT_BESOIN_LABELS[b.statut],
            cell: ({ row }) => (
                <StatutBesoinBadge statut={row.original.statut} />
            ),
        },
        {
            id: 'demandeur',
            header: 'Demandeur',
            accessorFn: (b) => nomComplet(b.demandeur),
            cell: ({ row }) => (
                <span className="text-xs">
                    {nomComplet(row.original.demandeur)}
                </span>
            ),
        },
        {
            id: 'destination',
            header: 'Destination',
            accessorFn: (b) => b.appartement?.numero ?? '',
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground">
                    {row.original.appartement?.numero ?? '—'}
                </span>
            ),
        },
        {
            id: 'created_at',
            header: 'Exprimé le',
            accessorFn: (b) => b.created_at ?? '',
            cell: ({ row }) => (
                <span className="text-xs">
                    {fmtDate(row.original.created_at)}
                </span>
            ),
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const besoin = row.original;

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
                            {besoin.statut === 'brouillon' && (
                                <DropdownMenuItem
                                    onClick={() => ouvrirEdition(besoin)}
                                >
                                    Modifier
                                </DropdownMenuItem>
                            )}
                            {besoin.transitions.map((cible) => (
                                <DropdownMenuItem
                                    key={cible}
                                    onClick={() => changerStatut(besoin, cible)}
                                >
                                    {cible === 'soumis' && 'Soumettre'}
                                    {cible === 'valide' && 'Valider'}
                                    {cible === 'refuse' && 'Refuser…'}
                                    {cible === 'brouillon' &&
                                        'Remettre en brouillon'}
                                    {cible === 'commande' && 'Commander'}
                                </DropdownMenuItem>
                            ))}
                            {besoin.statut !== 'commande' && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => supprimer(besoin)}
                                    >
                                        <span className="text-red-500">
                                            Supprimer
                                        </span>
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    const aValider = besoins.filter((b) => b.statut === 'soumis').length;

    return (
        <>
            <Head title="Expression de besoins" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Expression de besoins
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {besoins.length} besoin
                            {besoins.length > 1 ? 's' : ''}
                            {aValider > 0 &&
                                ` · ${aValider} en attente de validation`}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-end gap-2">
                        <div className="grid gap-1.5">
                            <Label htmlFor="f-statut" className="text-xs">
                                Statut
                            </Label>
                            <Select
                                value={statut}
                                onValueChange={(v) => filtrer(v, priorite)}
                            >
                                <SelectTrigger id="f-statut" className="w-44">
                                    <SelectValue placeholder="Tous" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={TOUS}>Tous</SelectItem>
                                    {STATUTS_BESOIN.map((s) => (
                                        <SelectItem key={s} value={s}>
                                            {STATUT_BESOIN_LABELS[s]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="f-priorite" className="text-xs">
                                Priorité
                            </Label>
                            <Select
                                value={priorite}
                                onValueChange={(v) => filtrer(statut, v)}
                            >
                                <SelectTrigger id="f-priorite" className="w-36">
                                    <SelectValue placeholder="Toutes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={TOUS}>Toutes</SelectItem>
                                    {PRIORITES.map((p) => (
                                        <SelectItem key={p} value={p}>
                                            {PRIORITE_LABELS[p]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={besoins}
                    searchPlaceholder="Rechercher un besoin..."
                    toolbar={
                        <Button onClick={ouvrirCreation}>
                            <Plus /> Nouveau besoin
                        </Button>
                    }
                />
            </div>

            {/* ------------------------------------------------ saisie / édition */}
            <Dialog open={ouvert} onOpenChange={setOuvert}>
                <DialogContent>
                    <form onSubmit={enregistrer} className="grid gap-4">
                        <DialogHeader>
                            <DialogTitle>
                                {enEdition
                                    ? 'Modifier le besoin'
                                    : 'Nouveau besoin'}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="grid gap-1.5">
                            <Label htmlFor="designation">Désignation</Label>
                            <Input
                                id="designation"
                                required
                                maxLength={255}
                                value={form.designation}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        designation: e.target.value,
                                    })
                                }
                                placeholder="Climatiseur split 12000 BTU"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="quantite">Quantité</Label>
                                <Input
                                    id="quantite"
                                    type="number"
                                    min={1}
                                    max={9999}
                                    required
                                    value={form.quantite}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            quantite: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="priorite">Priorité</Label>
                                <Select
                                    value={form.priorite}
                                    onValueChange={(v) =>
                                        setForm({
                                            ...form,
                                            priorite: v as PrioriteBesoin,
                                        })
                                    }
                                >
                                    <SelectTrigger id="priorite">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PRIORITES.map((p) => (
                                            <SelectItem key={p} value={p}>
                                                {PRIORITE_LABELS[p]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="demandeur">Demandeur</Label>
                                <Select
                                    value={form.demandeur_employe_id}
                                    onValueChange={(v) =>
                                        setForm({
                                            ...form,
                                            demandeur_employe_id: v,
                                        })
                                    }
                                >
                                    <SelectTrigger id="demandeur">
                                        <SelectValue placeholder="Aucun" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={TOUS}>
                                            Aucun
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
                            <div className="grid gap-1.5">
                                <Label htmlFor="appartement">
                                    Destination prévue
                                </Label>
                                <Select
                                    value={form.appartement_id}
                                    onValueChange={(v) =>
                                        setForm({ ...form, appartement_id: v })
                                    }
                                >
                                    <SelectTrigger id="appartement">
                                        <SelectValue placeholder="Aucune" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={TOUS}>
                                            Aucune
                                        </SelectItem>
                                        {appartements.map((a) => (
                                            <SelectItem
                                                key={a.id}
                                                value={String(a.id)}
                                            >
                                                {a.numero}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="justification">Justification</Label>
                            <textarea
                                id="justification"
                                rows={3}
                                maxLength={2000}
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                value={form.justification}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        justification: e.target.value,
                                    })
                                }
                                placeholder="Remplacement des unités réformées en A-101 et A-102."
                            />
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

            {/* ------------------------------------------------------- refus motivé */}
            <Dialog
                open={refus !== null}
                onOpenChange={(o) => !o && setRefus(null)}
            >
                <DialogContent>
                    <form onSubmit={confirmerRefus} className="grid gap-4">
                        <DialogHeader>
                            <DialogTitle>Refuser le besoin</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm text-muted-foreground">
                            « {refus?.designation} » retournera en brouillon et
                            pourra être corrigé puis resoumis.
                        </p>
                        <div className="grid gap-1.5">
                            <Label htmlFor="motif">Motif du refus</Label>
                            <textarea
                                id="motif"
                                rows={3}
                                required
                                maxLength={2000}
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                value={motif}
                                onChange={(e) => setMotif(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setRefus(null)}
                            >
                                Annuler
                            </Button>
                            <Button type="submit" variant="destructive">
                                Refuser
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

Besoins.layout = {
    breadcrumbs: [
        { title: 'Logistique', href: '/admin/logistique' },
        {
            title: 'Expression de besoins',
            href: LogistiqueController.besoins(),
        },
    ],
};
