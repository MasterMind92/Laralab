import { Head, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import LogistiqueController from '@/actions/App/Http/Controllers/LogistiqueController';
import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
    fmtMontant,
    STATUT_COMMANDE_LABELS,
    STATUTS_COMMANDE,
    StatutCommandeBadge,
} from './shared';
import type {
    CommandeRow,
    FournisseurRef,
    LigneACommander,
    StatutCommande,
} from './shared';

/**
 * Bons de commande fournisseur (Phase 10, étape B).
 *
 * Les deux statuts de réception n'apparaissent JAMAIS dans le menu d'actions : ils sortent
 * de `Commande::recalculerStatut()`, pas d'une décision humaine. Le menu ne propose que ce
 * que le serveur renvoie dans `transitions`.
 */
const TOUS = '__tous__';

type LigneSaisie = {
    besoin_id: number | null;
    designation: string;
    quantite: string;
    prix_unitaire: string;
};

const LIGNE_VIDE: LigneSaisie = {
    besoin_id: null,
    designation: '',
    quantite: '1',
    prix_unitaire: '0',
};

export default function Commandes({
    commandes,
    fournisseurs,
    besoins_a_commander: besoinsACommander,
    filters,
}: {
    commandes: CommandeRow[];
    fournisseurs: FournisseurRef[];
    besoins_a_commander: LigneACommander[];
    filters: { statut?: StatutCommande | null };
}) {
    const [statut, setStatut] = useState<string>(filters.statut ?? TOUS);

    const [ouvert, setOuvert] = useState(false);
    const [fournisseurId, setFournisseurId] = useState('');
    const [livraison, setLivraison] = useState('');
    const [notes, setNotes] = useState('');
    const [lignes, setLignes] = useState<LigneSaisie[]>([]);

    const [nouveauFournisseur, setNouveauFournisseur] = useState(false);
    const [fNom, setFNom] = useState('');
    const [fContact, setFContact] = useState('');
    const [fEmail, setFEmail] = useState('');
    const [fTelephone, setFTelephone] = useState('');

    function filtrer(choisi: string) {
        setStatut(choisi);
        router.get(
            LogistiqueController.commandes().url,
            { statut: choisi === TOUS ? undefined : choisi },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    function ouvrirCreation() {
        setFournisseurId(fournisseurs[0] ? String(fournisseurs[0].id) : '');
        setLivraison('');
        setNotes('');
        setLignes([]);
        setOuvert(true);
    }

    /** Un besoin validé se porte sur la commande sans ressaisie — c'est tout l'intérêt. */
    function basculerBesoin(besoin: LigneACommander, coche: boolean) {
        setLignes((actuelles) =>
            coche
                ? [
                      ...actuelles,
                      {
                          besoin_id: besoin.id,
                          designation: besoin.designation,
                          quantite: String(besoin.quantite),
                          prix_unitaire: '0',
                      },
                  ]
                : actuelles.filter((l) => l.besoin_id !== besoin.id),
        );
    }

    function majLigne(index: number, champ: keyof LigneSaisie, valeur: string) {
        setLignes((actuelles) =>
            actuelles.map((l, i) =>
                i === index ? { ...l, [champ]: valeur } : l,
            ),
        );
    }

    function creerCommande(e: FormEvent) {
        e.preventDefault();

        router.post(
            LogistiqueController.storeCommande().url,
            {
                fournisseur_id: Number(fournisseurId),
                date_livraison_prevue: livraison || null,
                notes: notes || null,
                lignes: lignes.map((l) => ({
                    besoin_id: l.besoin_id,
                    designation: l.designation,
                    quantite: Number(l.quantite),
                    prix_unitaire: Number(l.prix_unitaire),
                })),
            },
            { preserveScroll: true, onSuccess: () => setOuvert(false) },
        );
    }

    function creerFournisseur(e: FormEvent) {
        e.preventDefault();

        router.post(
            LogistiqueController.storeFournisseur().url,
            {
                nom: fNom,
                contact: fContact || null,
                email: fEmail || null,
                telephone: fTelephone || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setNouveauFournisseur(false);
                    setFNom('');
                    setFContact('');
                    setFEmail('');
                    setFTelephone('');
                },
            },
        );
    }

    function changerStatut(commande: CommandeRow, cible: StatutCommande) {
        if (
            cible === 'annulee' &&
            !confirm(`Annuler la commande ${commande.reference} ?`)
        ) {
            return;
        }

        router.patch(
            LogistiqueController.changerStatutCommande(commande.id).url,
            { statut: cible },
            { preserveScroll: true },
        );
    }

    const total = lignes.reduce(
        (somme, l) =>
            somme + Number(l.quantite || 0) * Number(l.prix_unitaire || 0),
        0,
    );

    const columns: ColumnDef<CommandeRow>[] = [
        {
            accessorKey: 'reference',
            header: 'Référence',
            cell: ({ row }) => (
                <span className="font-mono text-sm">
                    {row.original.reference ?? '—'}
                </span>
            ),
        },
        {
            id: 'fournisseur',
            header: 'Fournisseur',
            accessorFn: (c) => c.fournisseur?.nom ?? '',
            cell: ({ row }) => (
                <span className="text-sm">
                    {row.original.fournisseur?.nom ?? '—'}
                </span>
            ),
        },
        {
            id: 'statut',
            header: 'Statut',
            accessorFn: (c) => STATUT_COMMANDE_LABELS[c.statut],
            cell: ({ row }) => (
                <StatutCommandeBadge statut={row.original.statut} />
            ),
        },
        {
            accessorKey: 'nb_lignes',
            header: 'Lignes',
            cell: ({ row }) => (
                <span className="text-sm tabular-nums">
                    {row.original.nb_lignes}
                </span>
            ),
        },
        {
            id: 'montant',
            header: 'Montant',
            accessorFn: (c) => c.montant_total,
            cell: ({ row }) => (
                <span className="text-sm tabular-nums">
                    {fmtMontant(row.original.montant_total)}
                </span>
            ),
        },
        {
            id: 'livraison',
            header: 'Livraison prévue',
            accessorFn: (c) => c.date_livraison_prevue ?? '',
            cell: ({ row }) => (
                <span className="text-xs">
                    {fmtDate(row.original.date_livraison_prevue)}
                </span>
            ),
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const commande = row.original;

                if (commande.transitions.length === 0) {
                    return (
                        <span className="text-xs text-muted-foreground">—</span>
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
                            {commande.transitions.map((cible) => (
                                <DropdownMenuItem
                                    key={cible}
                                    onClick={() =>
                                        changerStatut(commande, cible)
                                    }
                                >
                                    {cible === 'envoyee' &&
                                        'Marquer envoyée au fournisseur'}
                                    {cible === 'confirmee' &&
                                        'Marquer confirmée'}
                                    {cible === 'annulee' && (
                                        <span className="text-red-500">
                                            Annuler la commande
                                        </span>
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    return (
        <>
            <Head title="Commandes fournisseur" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold">Commandes</h1>
                        <p className="text-sm text-muted-foreground">
                            {commandes.length} commande
                            {commandes.length > 1 ? 's' : ''}
                            {besoinsACommander.length > 0 &&
                                ` · ${besoinsACommander.length} besoin${besoinsACommander.length > 1 ? 's' : ''} validé${besoinsACommander.length > 1 ? 's' : ''} en attente`}
                        </p>
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="f-statut" className="text-xs">
                            Statut
                        </Label>
                        <Select value={statut} onValueChange={filtrer}>
                            <SelectTrigger id="f-statut" className="w-52">
                                <SelectValue placeholder="Tous" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TOUS}>Tous</SelectItem>
                                {STATUTS_COMMANDE.map((s) => (
                                    <SelectItem key={s} value={s}>
                                        {STATUT_COMMANDE_LABELS[s]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={commandes}
                    searchPlaceholder="Rechercher une commande..."
                    toolbar={
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setNouveauFournisseur(true)}
                            >
                                <Plus /> Fournisseur
                            </Button>
                            <Button
                                onClick={ouvrirCreation}
                                disabled={fournisseurs.length === 0}
                            >
                                <Plus /> Nouvelle commande
                            </Button>
                        </div>
                    }
                />

                {fournisseurs.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        Aucun fournisseur enregistré : commencez par en créer
                        un, une commande ne peut pas être passée sans
                        destinataire.
                    </p>
                )}
            </div>

            {/* ------------------------------------------------- nouvelle commande */}
            <Dialog open={ouvert} onOpenChange={setOuvert}>
                <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
                    <form onSubmit={creerCommande} className="grid gap-4">
                        <DialogHeader>
                            <DialogTitle>Nouvelle commande</DialogTitle>
                        </DialogHeader>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="fournisseur">Fournisseur</Label>
                                <Select
                                    value={fournisseurId}
                                    onValueChange={setFournisseurId}
                                >
                                    <SelectTrigger id="fournisseur">
                                        <SelectValue placeholder="Choisir" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {fournisseurs.map((f) => (
                                            <SelectItem
                                                key={f.id}
                                                value={String(f.id)}
                                            >
                                                {f.nom}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="livraison">
                                    Livraison prévue
                                </Label>
                                <Input
                                    id="livraison"
                                    type="date"
                                    value={livraison}
                                    onChange={(e) =>
                                        setLivraison(e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        {besoinsACommander.length > 0 && (
                            <div className="grid gap-2 rounded-md border p-3">
                                <p className="text-sm font-medium">
                                    Besoins validés en attente
                                </p>
                                <div className="grid gap-2">
                                    {besoinsACommander.map((b) => (
                                        <label
                                            key={b.id}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            <Checkbox
                                                checked={lignes.some(
                                                    (l) => l.besoin_id === b.id,
                                                )}
                                                onCheckedChange={(c) =>
                                                    basculerBesoin(
                                                        b,
                                                        c === true,
                                                    )
                                                }
                                            />
                                            <span>{b.designation}</span>
                                            <span className="text-xs text-muted-foreground">
                                                × {b.quantite}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label>Lignes de la commande</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setLignes([
                                            ...lignes,
                                            { ...LIGNE_VIDE },
                                        ])
                                    }
                                >
                                    <Plus /> Ligne libre
                                </Button>
                            </div>

                            {lignes.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    Cochez un besoin ci-dessus ou ajoutez une
                                    ligne libre.
                                </p>
                            )}

                            {lignes.map((ligne, index) => (
                                <div
                                    key={index}
                                    className="grid grid-cols-[1fr_80px_120px_36px] items-end gap-2"
                                >
                                    <div className="grid gap-1">
                                        <span className="text-xs text-muted-foreground">
                                            Désignation
                                        </span>
                                        <Input
                                            required
                                            value={ligne.designation}
                                            onChange={(e) =>
                                                majLigne(
                                                    index,
                                                    'designation',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-1">
                                        <span className="text-xs text-muted-foreground">
                                            Qté
                                        </span>
                                        <Input
                                            type="number"
                                            min={1}
                                            required
                                            value={ligne.quantite}
                                            onChange={(e) =>
                                                majLigne(
                                                    index,
                                                    'quantite',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-1">
                                        <span className="text-xs text-muted-foreground">
                                            Prix unitaire
                                        </span>
                                        <Input
                                            type="number"
                                            min={0}
                                            step="1"
                                            required
                                            value={ligne.prix_unitaire}
                                            onChange={(e) =>
                                                majLigne(
                                                    index,
                                                    'prix_unitaire',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Retirer la ligne"
                                        onClick={() =>
                                            setLignes(
                                                lignes.filter(
                                                    (_, i) => i !== index,
                                                ),
                                            )
                                        }
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}

                            {lignes.length > 0 && (
                                <p className="text-right text-sm font-medium tabular-nums">
                                    Total : {fmtMontant(total)}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="notes">Notes</Label>
                            <textarea
                                id="notes"
                                rows={2}
                                maxLength={2000}
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
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
                            <Button
                                type="submit"
                                disabled={
                                    lignes.length === 0 || fournisseurId === ''
                                }
                            >
                                Créer la commande
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ---------------------------------------------- nouveau fournisseur */}
            <Dialog
                open={nouveauFournisseur}
                onOpenChange={setNouveauFournisseur}
            >
                <DialogContent>
                    <form onSubmit={creerFournisseur} className="grid gap-4">
                        <DialogHeader>
                            <DialogTitle>Nouveau fournisseur</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-1.5">
                            <Label htmlFor="f-nom">Nom</Label>
                            <Input
                                id="f-nom"
                                required
                                maxLength={255}
                                value={fNom}
                                onChange={(e) => setFNom(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="f-contact">Contact</Label>
                                <Input
                                    id="f-contact"
                                    maxLength={255}
                                    value={fContact}
                                    onChange={(e) =>
                                        setFContact(e.target.value)
                                    }
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="f-tel">Téléphone</Label>
                                <Input
                                    id="f-tel"
                                    maxLength={30}
                                    value={fTelephone}
                                    onChange={(e) =>
                                        setFTelephone(e.target.value)
                                    }
                                />
                            </div>
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="f-email">E-mail</Label>
                            <Input
                                id="f-email"
                                type="email"
                                maxLength={255}
                                value={fEmail}
                                onChange={(e) => setFEmail(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setNouveauFournisseur(false)}
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

Commandes.layout = {
    breadcrumbs: [
        { title: 'Logistique', href: '/admin/logistique' },
        { title: 'Commandes', href: LogistiqueController.commandes() },
    ],
};
