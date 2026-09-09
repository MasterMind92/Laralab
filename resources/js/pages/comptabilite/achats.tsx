import { Head, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus, Trash2 } from 'lucide-react';
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
import {
    CATEGORIE_LABELS,
    fmtDate,
    fmtMontant,
    MODE_PAIEMENT_LABELS,
    NatureBadge,
    STATUT_ACHAT_LABELS,
    STATUTS_ACHAT,
    StatutAchatBadge,
} from './shared';
import type {
    AchatRow,
    CategorieCharge,
    CommandeFacturable,
    FournisseurRef,
    ModePaiementFournisseur,
    NatureLigne,
    StatutAchat,
} from './shared';

/**
 * Achats — les factures fournisseur (Phase 06, étape B).
 *
 * La saisie part d'un bon de commande réceptionné, choisi dans une liste : les lignes se
 * pré-remplissent sur les quantités RÉELLEMENT REÇUES, pas commandées. C'est ce que le
 * fournisseur est censé facturer, et l'écart saute aux yeux s'il facture autre chose —
 * la quantité commandée reste affichée à côté pour la comparaison.
 *
 * La nature proposée vient du serveur : une ligne qui a produit des équipements est un
 * bien durable, donc une immobilisation. C'est une proposition, corrigeable ligne par
 * ligne — deviner faux sans pouvoir corriger fausserait le compte de résultat en silence.
 */
const TOUS = '__tous__';
const AUCUNE = '__aucune__';

type LigneSaisie = {
    commande_ligne_id: number | null;
    designation: string;
    quantite_commandee: number | null;
    quantite: string;
    prix_unitaire: string;
    nature: NatureLigne;
    categorie: CategorieCharge;
};

const LIGNE_VIDE: LigneSaisie = {
    commande_ligne_id: null,
    designation: '',
    quantite_commandee: null,
    quantite: '1',
    prix_unitaire: '0',
    nature: 'charge',
    categorie: 'autres',
};

export default function Achats({
    factures,
    fournisseurs,
    commandes_facturables: commandesFacturables,
    filters,
}: {
    factures: AchatRow[];
    fournisseurs: FournisseurRef[];
    commandes_facturables: CommandeFacturable[];
    filters: { statut?: StatutAchat | null; fournisseur_id?: number | null };
}) {
    const [statut, setStatut] = useState<string>(filters.statut ?? TOUS);

    const [ouvert, setOuvert] = useState(false);
    const [commandeId, setCommandeId] = useState(AUCUNE);
    const [fournisseurId, setFournisseurId] = useState('');
    const [reference, setReference] = useState('');
    const [dateFacture, setDateFacture] = useState('');
    const [dateEcheance, setDateEcheance] = useState('');
    const [notes, setNotes] = useState('');
    const [lignes, setLignes] = useState<LigneSaisie[]>([]);

    const [detail, setDetail] = useState<AchatRow | null>(null);
    const [aPayer, setAPayer] = useState<AchatRow | null>(null);
    const [datePaiement, setDatePaiement] = useState('');
    const [modePaiement, setModePaiement] =
        useState<ModePaiementFournisseur>('virement');
    const [referencePaiement, setReferencePaiement] = useState('');

    function filtrer(choisi: string) {
        setStatut(choisi);
        router.get(
            ComptabiliteController.achats().url,
            { statut: choisi === TOUS ? undefined : choisi },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    function ouvrirCreation() {
        setCommandeId(AUCUNE);
        setFournisseurId(fournisseurs[0] ? String(fournisseurs[0].id) : '');
        setReference('');
        setDateFacture(new Date().toISOString().slice(0, 10));
        setDateEcheance('');
        setNotes('');
        setLignes([]);
        setOuvert(true);
    }

    /** Le geste central de l'écran : le bon de commande remplit la facture. */
    function choisirCommande(valeur: string) {
        setCommandeId(valeur);

        if (valeur === AUCUNE) {
            setLignes([]);

            return;
        }

        const commande = commandesFacturables.find(
            (c) => String(c.id) === valeur,
        );

        if (!commande) {
            return;
        }

        if (commande.fournisseur) {
            setFournisseurId(String(commande.fournisseur.id));
        }

        setLignes(
            commande.lignes
                // Une ligne dont rien n'est arrivé n'a pas à être facturée : on ne la
                // propose pas plutôt que de la proposer à zéro.
                .filter((l) => l.quantite > 0)
                .map((l) => ({
                    commande_ligne_id: l.commande_ligne_id,
                    designation: l.designation,
                    quantite_commandee: l.quantite_commandee,
                    quantite: String(l.quantite),
                    prix_unitaire: String(l.prix_unitaire),
                    nature: l.nature,
                    categorie: 'autres' as CategorieCharge,
                })),
        );
    }

    function majLigne<K extends keyof LigneSaisie>(
        index: number,
        champ: K,
        valeur: LigneSaisie[K],
    ) {
        setLignes((actuelles) =>
            actuelles.map((l, i) =>
                i === index ? { ...l, [champ]: valeur } : l,
            ),
        );
    }

    function creer(e: FormEvent) {
        e.preventDefault();

        router.post(
            ComptabiliteController.storeAchat().url,
            {
                fournisseur_id: Number(fournisseurId),
                commande_id: commandeId === AUCUNE ? null : Number(commandeId),
                reference: reference || null,
                date_facture: dateFacture,
                date_echeance: dateEcheance || null,
                notes: notes || null,
                lignes: lignes.map((l) => ({
                    commande_ligne_id: l.commande_ligne_id,
                    designation: l.designation,
                    quantite: Number(l.quantite),
                    prix_unitaire: Number(l.prix_unitaire),
                    nature: l.nature,
                    categorie: l.nature === 'charge' ? l.categorie : null,
                })),
            },
            { preserveScroll: true, onSuccess: () => setOuvert(false) },
        );
    }

    function changerStatut(achat: AchatRow, cible: StatutAchat) {
        if (cible === 'annulee' && !confirm('Annuler cette facture ?')) {
            return;
        }

        router.patch(
            ComptabiliteController.changerStatutAchat(achat.id).url,
            { statut: cible },
            { preserveScroll: true },
        );
    }

    function ouvrirPaiement(achat: AchatRow) {
        setAPayer(achat);
        setDatePaiement(new Date().toISOString().slice(0, 10));
        setModePaiement('virement');
        setReferencePaiement('');
    }

    function payer(e: FormEvent) {
        e.preventDefault();

        if (!aPayer) {
            return;
        }

        router.patch(
            ComptabiliteController.payerAchat(aPayer.id).url,
            {
                date_paiement: datePaiement,
                mode_paiement: modePaiement,
                reference_paiement: referencePaiement || null,
            },
            { preserveScroll: true, onSuccess: () => setAPayer(null) },
        );
    }

    function supprimer(achat: AchatRow) {
        if (!confirm('Supprimer cette facture fournisseur ?')) {
            return;
        }

        router.delete(ComptabiliteController.destroyAchat(achat.id).url, {
            preserveScroll: true,
        });
    }

    const totalSaisi = lignes.reduce(
        (s, l) => s + Number(l.quantite || 0) * Number(l.prix_unitaire || 0),
        0,
    );
    const immobiliseSaisi = lignes
        .filter((l) => l.nature === 'immobilisation')
        .reduce(
            (s, l) =>
                s + Number(l.quantite || 0) * Number(l.prix_unitaire || 0),
            0,
        );

    const aValider = factures.filter((f) => f.statut === 'a_valider').length;
    const aRegler = factures.filter((f) => f.statut === 'validee');

    const columns: ColumnDef<AchatRow>[] = [
        {
            accessorKey: 'reference',
            header: 'Référence',
            cell: ({ row }) => (
                <div className="space-y-0.5">
                    <p className="font-mono text-sm">
                        {row.original.reference ?? '—'}
                    </p>
                    {row.original.commande && (
                        <p className="font-mono text-xs text-muted-foreground">
                            {row.original.commande}
                        </p>
                    )}
                </div>
            ),
        },
        {
            id: 'fournisseur',
            header: 'Fournisseur',
            accessorFn: (f) => f.fournisseur?.nom ?? '',
            cell: ({ row }) => (
                <span className="text-sm">
                    {row.original.fournisseur?.nom ?? '—'}
                </span>
            ),
        },
        {
            id: 'statut',
            header: 'Statut',
            accessorFn: (f) => STATUT_ACHAT_LABELS[f.statut],
            cell: ({ row }) => (
                <div className="flex flex-wrap items-center gap-1.5">
                    <StatutAchatBadge statut={row.original.statut} />
                    {row.original.en_retard && (
                        <Badge variant="destructive">Échue</Badge>
                    )}
                </div>
            ),
        },
        {
            id: 'montant',
            header: 'Montant',
            accessorFn: (f) => f.montant_total,
            cell: ({ row }) => (
                <div className="space-y-0.5">
                    <p className="text-sm tabular-nums">
                        {fmtMontant(row.original.montant_total)}
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
            id: 'date_facture',
            header: 'Facturée le',
            accessorFn: (f) => f.date_facture ?? '',
            cell: ({ row }) => (
                <span className="text-xs">
                    {fmtDate(row.original.date_facture)}
                </span>
            ),
        },
        {
            id: 'echeance',
            header: 'Échéance',
            accessorFn: (f) => f.date_echeance ?? '',
            cell: ({ row }) => (
                <span className="text-xs">
                    {fmtDate(row.original.date_echeance)}
                </span>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const achat = row.original;

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
                            <DropdownMenuItem onClick={() => setDetail(achat)}>
                                Voir le détail
                            </DropdownMenuItem>
                            {achat.transitions.includes('validee') && (
                                <DropdownMenuItem
                                    onClick={() =>
                                        changerStatut(achat, 'validee')
                                    }
                                >
                                    Valider
                                </DropdownMenuItem>
                            )}
                            {achat.transitions.includes('payee') && (
                                <DropdownMenuItem
                                    onClick={() => ouvrirPaiement(achat)}
                                >
                                    Enregistrer le règlement…
                                </DropdownMenuItem>
                            )}
                            {achat.transitions.includes('a_valider') && (
                                <DropdownMenuItem
                                    onClick={() =>
                                        changerStatut(achat, 'a_valider')
                                    }
                                >
                                    Renvoyer en validation
                                </DropdownMenuItem>
                            )}
                            {achat.transitions.includes('annulee') && (
                                <DropdownMenuItem
                                    onClick={() =>
                                        changerStatut(achat, 'annulee')
                                    }
                                >
                                    Annuler
                                </DropdownMenuItem>
                            )}
                            {achat.statut !== 'payee' && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => supprimer(achat)}
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

    return (
        <>
            <Head title="Achats — factures fournisseur" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold">Achats</h1>
                        <p className="text-sm text-muted-foreground">
                            {factures.length} facture
                            {factures.length > 1 ? 's' : ''} fournisseur
                            {aValider > 0 && ` · ${aValider} à valider`}
                            {aRegler.length > 0 &&
                                ` · ${fmtMontant(aRegler.reduce((s, f) => s + f.montant_total, 0))} à régler`}
                        </p>
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="f-statut" className="text-xs">
                            Statut
                        </Label>
                        <Select value={statut} onValueChange={filtrer}>
                            <SelectTrigger id="f-statut" className="w-44">
                                <SelectValue placeholder="Tous" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TOUS}>Tous</SelectItem>
                                {STATUTS_ACHAT.map((s) => (
                                    <SelectItem key={s} value={s}>
                                        {STATUT_ACHAT_LABELS[s]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={factures}
                    searchPlaceholder="Rechercher une facture..."
                    toolbar={
                        <Button
                            onClick={ouvrirCreation}
                            disabled={fournisseurs.length === 0}
                        >
                            <Plus /> Nouvelle facture
                        </Button>
                    }
                />

                {fournisseurs.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        Aucun fournisseur enregistré : ils se créent depuis
                        l'écran Commandes du pôle Logistique.
                    </p>
                )}
            </div>

            {/* ------------------------------------------------ nouvelle facture */}
            <Dialog open={ouvert} onOpenChange={setOuvert}>
                <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
                    <form onSubmit={creer} className="grid gap-4">
                        <DialogHeader>
                            <DialogTitle>
                                Nouvelle facture fournisseur
                            </DialogTitle>
                        </DialogHeader>

                        <div className="grid gap-1.5 rounded-md border p-3">
                            <Label htmlFor="commande">
                                Partir d'un bon de commande
                            </Label>
                            <Select
                                value={commandeId}
                                onValueChange={choisirCommande}
                            >
                                <SelectTrigger id="commande">
                                    <SelectValue placeholder="Aucun — saisie libre" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={AUCUNE}>
                                        Aucun — saisie libre
                                    </SelectItem>
                                    {commandesFacturables.map((c) => (
                                        <SelectItem
                                            key={c.id}
                                            value={String(c.id)}
                                        >
                                            {c.reference} ·{' '}
                                            {c.fournisseur?.nom ??
                                                'fournisseur inconnu'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Les lignes se remplissent sur les quantités
                                <strong> réellement reçues</strong>. Tout reste
                                modifiable : un fournisseur ne facture pas
                                toujours ce qui est arrivé.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
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
                                <Label htmlFor="reference">
                                    Référence du fournisseur
                                </Label>
                                <Input
                                    id="reference"
                                    maxLength={255}
                                    placeholder="Le numéro figurant sur son document"
                                    value={reference}
                                    onChange={(e) =>
                                        setReference(e.target.value)
                                    }
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="date-facture">
                                    Date de la facture
                                </Label>
                                <Input
                                    id="date-facture"
                                    type="date"
                                    required
                                    value={dateFacture}
                                    onChange={(e) =>
                                        setDateFacture(e.target.value)
                                    }
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="date-echeance">Échéance</Label>
                                <Input
                                    id="date-echeance"
                                    type="date"
                                    value={dateEcheance}
                                    onChange={(e) =>
                                        setDateEcheance(e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label>Lignes de la facture</Label>
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
                                    Choisissez un bon de commande ci-dessus, ou
                                    ajoutez une ligne libre.
                                </p>
                            )}

                            {lignes.map((ligne, index) => {
                                const ecart =
                                    ligne.quantite_commandee !== null &&
                                    Number(ligne.quantite) !==
                                        ligne.quantite_commandee;

                                return (
                                    <div
                                        key={index}
                                        className="grid gap-2 rounded-md border p-3"
                                    >
                                        <div className="grid grid-cols-[1fr_90px_130px_36px] items-end gap-2">
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
                                                            (_, i) =>
                                                                i !== index,
                                                        ),
                                                    )
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="flex flex-wrap items-end gap-3">
                                            <div className="grid gap-1">
                                                <span className="text-xs text-muted-foreground">
                                                    Nature comptable
                                                </span>
                                                <Select
                                                    value={ligne.nature}
                                                    onValueChange={(v) =>
                                                        majLigne(
                                                            index,
                                                            'nature',
                                                            v as NatureLigne,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="w-52">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="charge">
                                                            Charge de l'exercice
                                                        </SelectItem>
                                                        <SelectItem value="immobilisation">
                                                            Immobilisation
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {ligne.nature === 'charge' && (
                                                <div className="grid gap-1">
                                                    <span className="text-xs text-muted-foreground">
                                                        Famille de charge
                                                    </span>
                                                    <Select
                                                        value={ligne.categorie}
                                                        onValueChange={(v) =>
                                                            majLigne(
                                                                index,
                                                                'categorie',
                                                                v as CategorieCharge,
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="w-56">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {Object.entries(
                                                                CATEGORIE_LABELS,
                                                            ).map(
                                                                ([
                                                                    cle,
                                                                    libelle,
                                                                ]) => (
                                                                    <SelectItem
                                                                        key={
                                                                            cle
                                                                        }
                                                                        value={
                                                                            cle
                                                                        }
                                                                    >
                                                                        {
                                                                            libelle
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}

                                            {ligne.quantite_commandee !==
                                                null && (
                                                <p
                                                    className={
                                                        ecart
                                                            ? 'pb-2 text-xs font-medium text-red-500'
                                                            : 'pb-2 text-xs text-muted-foreground'
                                                    }
                                                >
                                                    Commandé :{' '}
                                                    {ligne.quantite_commandee}
                                                    {ecart && ' — écart'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {lignes.length > 0 && (
                                <p className="text-right text-sm font-medium tabular-nums">
                                    Total : {fmtMontant(totalSaisi)}
                                    {immobiliseSaisi > 0 && (
                                        <span className="font-normal text-muted-foreground">
                                            {' '}
                                            · dont {fmtMontant(
                                                immobiliseSaisi,
                                            )}{' '}
                                            immobilisés, hors résultat
                                        </span>
                                    )}
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
                                Enregistrer
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ------------------------------------------------------- règlement */}
            <Dialog
                open={aPayer !== null}
                onOpenChange={(o) => !o && setAPayer(null)}
            >
                <DialogContent>
                    <form onSubmit={payer} className="grid gap-4">
                        <DialogHeader>
                            <DialogTitle>
                                Régler {aPayer?.reference ?? 'la facture'}
                            </DialogTitle>
                        </DialogHeader>

                        <p className="text-sm text-muted-foreground">
                            {fmtMontant(aPayer?.montant_total ?? 0)} à régler.
                            L'enregistrement du paiement inscrit{' '}
                            {fmtMontant(aPayer?.montant_charges ?? 0)} au
                            journal des charges
                            {(aPayer?.montant_immobilise ?? 0) > 0 &&
                                ` ; les ${fmtMontant(aPayer?.montant_immobilise ?? 0)} immobilisés n'y entrent pas`}
                            .
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="date-paiement">
                                    Date du règlement
                                </Label>
                                <Input
                                    id="date-paiement"
                                    type="date"
                                    required
                                    value={datePaiement}
                                    onChange={(e) =>
                                        setDatePaiement(e.target.value)
                                    }
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="mode">Mode</Label>
                                <Select
                                    value={modePaiement}
                                    onValueChange={(v) =>
                                        setModePaiement(
                                            v as ModePaiementFournisseur,
                                        )
                                    }
                                >
                                    <SelectTrigger id="mode">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(
                                            MODE_PAIEMENT_LABELS,
                                        ).map(([cle, libelle]) => (
                                            <SelectItem key={cle} value={cle}>
                                                {libelle}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="ref-paiement">
                                Référence du règlement
                            </Label>
                            <Input
                                id="ref-paiement"
                                maxLength={255}
                                value={referencePaiement}
                                onChange={(e) =>
                                    setReferencePaiement(e.target.value)
                                }
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setAPayer(null)}
                            >
                                Annuler
                            </Button>
                            <Button type="submit">
                                Enregistrer le règlement
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ---------------------------------------------------------- détail */}
            <Dialog
                open={detail !== null}
                onOpenChange={(o) => !o && setDetail(null)}
            >
                <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {detail?.reference ?? 'Facture fournisseur'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-3">
                        <p className="text-sm text-muted-foreground">
                            {detail?.fournisseur?.nom} · facturée le{' '}
                            {fmtDate(detail?.date_facture)}
                            {detail?.commande && ` · ${detail.commande}`}
                            {detail?.valideur &&
                                ` · validée par ${detail.valideur}`}
                            {detail?.date_paiement &&
                                ` · réglée le ${fmtDate(detail.date_paiement)}`}
                        </p>

                        <ul className="divide-y rounded-md border">
                            {detail?.lignes.map((l) => (
                                <li
                                    key={l.id}
                                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm">
                                            {l.designation}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {l.quantite} ×{' '}
                                            {fmtMontant(l.prix_unitaire)}
                                            {l.categorie &&
                                                ` · ${CATEGORIE_LABELS[l.categorie]}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <NatureBadge nature={l.nature} />
                                        <span className="text-sm tabular-nums">
                                            {fmtMontant(l.montant)}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <div className="text-right text-sm tabular-nums">
                            <p className="font-medium">
                                Total : {fmtMontant(detail?.montant_total ?? 0)}
                            </p>
                            <p className="text-muted-foreground">
                                Charges :{' '}
                                {fmtMontant(detail?.montant_charges ?? 0)} ·
                                Immobilisé :{' '}
                                {fmtMontant(detail?.montant_immobilise ?? 0)}
                            </p>
                        </div>

                        {detail?.notes && (
                            <p className="text-sm text-muted-foreground">
                                {detail.notes}
                            </p>
                        )}
                        {detail?.motif_rejet && (
                            <p className="text-sm text-red-500">
                                {detail.motif_rejet}
                            </p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

Achats.layout = {
    breadcrumbs: [
        { title: 'Comptabilité', href: '/admin/comptabilite' },
        { title: 'Achats', href: ComptabiliteController.achats() },
    ],
};
