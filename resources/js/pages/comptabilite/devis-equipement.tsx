import { Head, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Ban, Check, Eye, MoreHorizontal, Percent, RotateCcw, Wallet } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import ComptabiliteController from '@/actions/App/Http/Controllers/ComptabiliteController';
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
    fmtMontant,
    MODE_PAIEMENT_LABELS,
    STATUT_DEVIS_EQUIPEMENT_LABELS,
    StatutDevisEquipementBadge,
} from './shared';
import type {
    DevisEquipementRow,
    ModePaiementFournisseur,
    StatutDevisEquipement,
} from './shared';

/**
 * Devis équipement (extension Phase 06) — généré automatiquement à l'Enregistrement côté
 * Logistique (une ligne durable = facturable au Propriétaire, voir
 * `LogistiqueController::genererDevisEquipement()`). Rien ne se crée à la main ici,
 * contrairement à « Achats » : cet écran fait vivre le cycle
 * brouillon → validé → payé, et laisse ajuster la majoration tant que le devis est encore
 * en brouillon.
 */
export default function DevisEquipement({ devis }: { devis: DevisEquipementRow[] }) {
    const [detail, setDetail] = useState<DevisEquipementRow | null>(null);

    const [majoration, setMajoration] = useState<DevisEquipementRow | null>(null);
    const [majorationActive, setMajorationActive] = useState(false);
    const [tauxMajoration, setTauxMajoration] = useState('10');

    const [aPayer, setAPayer] = useState<DevisEquipementRow | null>(null);
    const [datePaiement, setDatePaiement] = useState('');
    const [modePaiement, setModePaiement] = useState<ModePaiementFournisseur>('virement');
    const [referencePaiement, setReferencePaiement] = useState('');

    function changerStatut(d: DevisEquipementRow, cible: StatutDevisEquipement) {
        if (cible === 'annulee' && !confirm('Annuler ce devis équipement ?')) {
            return;
        }

        router.patch(
            ComptabiliteController.changerStatutDevisEquipement(d.id).url,
            { statut: cible },
            { preserveScroll: true },
        );
    }

    function ouvrirMajoration(d: DevisEquipementRow) {
        setMajoration(d);
        setMajorationActive(d.majoration_active);
        setTauxMajoration(d.taux_majoration !== null ? String(d.taux_majoration * 100) : '10');
    }

    function enregistrerMajoration(e: FormEvent) {
        e.preventDefault();

        if (!majoration) {
            return;
        }

        router.patch(
            ComptabiliteController.majorerDevisEquipement(majoration.id).url,
            {
                majoration_active: majorationActive,
                taux_majoration: majorationActive ? Number(tauxMajoration) / 100 : null,
            },
            { preserveScroll: true, onSuccess: () => setMajoration(null) },
        );
    }

    function ouvrirPaiement(d: DevisEquipementRow) {
        setAPayer(d);
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
            ComptabiliteController.payerDevisEquipement(aPayer.id).url,
            {
                date_paiement: datePaiement,
                mode_paiement: modePaiement,
                reference_paiement: referencePaiement || null,
            },
            { preserveScroll: true, onSuccess: () => setAPayer(null) },
        );
    }

    const enBrouillon = devis.filter((d) => d.statut === 'brouillon').length;
    const aRegler = devis.filter((d) => d.statut === 'validee');

    const columns: ColumnDef<DevisEquipementRow>[] = [
        {
            id: 'reception',
            header: 'Réception',
            accessorFn: (d) => d.commande ?? '',
            cell: ({ row }) => (
                <div className="space-y-0.5">
                    <p className="font-mono text-sm">{row.original.commande ?? `#${row.original.reception}`}</p>
                    <p className="text-xs text-muted-foreground">{row.original.fournisseur ?? '—'}</p>
                </div>
            ),
        },
        {
            id: 'statut',
            header: 'Statut',
            accessorFn: (d) => STATUT_DEVIS_EQUIPEMENT_LABELS[d.statut],
            cell: ({ row }) => <StatutDevisEquipementBadge statut={row.original.statut} />,
        },
        {
            id: 'montant',
            header: 'Montant',
            accessorFn: (d) => d.montant,
            cell: ({ row }) => (
                <div className="space-y-0.5">
                    <p className="text-sm tabular-nums">{fmtMontant(row.original.montant)}</p>
                    {row.original.majoration_active && (
                        <p className="text-xs text-muted-foreground tabular-nums">
                            dont majoration de {((row.original.taux_majoration ?? 0) * 100).toFixed(0)} %
                        </p>
                    )}
                </div>
            ),
        },
        {
            id: 'date_validation',
            header: 'Validé le',
            accessorFn: (d) => d.date_validation ?? '',
            cell: ({ row }) => <span className="text-xs">{fmtDate(row.original.date_validation)}</span>,
        },
        {
            id: 'date_paiement',
            header: 'Payé le',
            accessorFn: (d) => d.date_paiement ?? '',
            cell: ({ row }) => <span className="text-xs">{fmtDate(row.original.date_paiement)}</span>,
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const d = row.original;

                if (d.transitions.length === 0 && d.statut !== 'brouillon') {
                    return (
                        <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setDetail(d)}>
                            <Eye className="h-4 w-4" />
                        </Button>
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
                            <DropdownMenuItem onClick={() => setDetail(d)}>
                                <Eye /> Voir le détail
                            </DropdownMenuItem>
                            {d.statut === 'brouillon' && (
                                <DropdownMenuItem onClick={() => ouvrirMajoration(d)}>
                                    <Percent /> Majoration…
                                </DropdownMenuItem>
                            )}
                            {d.transitions.includes('validee') && (
                                <DropdownMenuItem onClick={() => changerStatut(d, 'validee')}>
                                    <Check /> Valider
                                </DropdownMenuItem>
                            )}
                            {d.transitions.includes('payee') && (
                                <DropdownMenuItem onClick={() => ouvrirPaiement(d)}>
                                    <Wallet /> Enregistrer le règlement…
                                </DropdownMenuItem>
                            )}
                            {d.transitions.includes('brouillon') && (
                                <DropdownMenuItem onClick={() => changerStatut(d, 'brouillon')}>
                                    <RotateCcw /> Renvoyer en brouillon
                                </DropdownMenuItem>
                            )}
                            {d.transitions.includes('annulee') && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => changerStatut(d, 'annulee')}>
                                        <Ban className="text-red-500" />
                                        <span className="text-red-500">Annuler</span>
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
            <Head title="Devis équipement" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Devis équipement</h1>
                    <p className="text-sm text-muted-foreground">
                        {devis.length} devis
                        {enBrouillon > 0 && ` · ${enBrouillon} en brouillon`}
                        {aRegler.length > 0 &&
                            ` · ${fmtMontant(aRegler.reduce((s, d) => s + d.montant, 0))} à régler`}
                    </p>
                </div>

                <DataTable columns={columns} data={devis} searchPlaceholder="Rechercher un devis..." />

                {devis.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        Aucun devis pour l'instant : ils se génèrent automatiquement dès qu'une réception
                        est enregistrée côté Logistique.
                    </p>
                )}
            </div>

            {/* -------------------------------------------------------- majoration */}
            <Dialog open={majoration !== null} onOpenChange={(o) => !o && setMajoration(null)}>
                <DialogContent>
                    <form onSubmit={enregistrerMajoration} className="grid gap-4">
                        <DialogHeader>
                            <DialogTitle>Majoration (frais de gestion)</DialogTitle>
                        </DialogHeader>

                        <p className="text-sm text-muted-foreground">
                            Choix fait au cas par cas pour ce devis — pas un réglage global.
                        </p>

                        <div className="flex items-center gap-2 rounded-md border p-3">
                            <Checkbox
                                id="majoration-active"
                                checked={majorationActive}
                                onCheckedChange={(v) => setMajorationActive(v === true)}
                            />
                            <Label htmlFor="majoration-active">Appliquer une majoration</Label>
                        </div>

                        {majorationActive && (
                            <div className="grid gap-1.5">
                                <Label htmlFor="taux">Taux (%)</Label>
                                <Input
                                    id="taux"
                                    type="number"
                                    min={0}
                                    max={100}
                                    step="0.5"
                                    required
                                    value={tauxMajoration}
                                    onChange={(e) => setTauxMajoration(e.target.value)}
                                />
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setMajoration(null)}>
                                Annuler
                            </Button>
                            <Button type="submit">Enregistrer</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ---------------------------------------------------------- règlement */}
            <Dialog open={aPayer !== null} onOpenChange={(o) => !o && setAPayer(null)}>
                <DialogContent>
                    <form onSubmit={payer} className="grid gap-4">
                        <DialogHeader>
                            <DialogTitle>Régler le devis équipement</DialogTitle>
                        </DialogHeader>

                        <p className="text-sm text-muted-foreground">
                            {fmtMontant(aPayer?.montant ?? 0)} à régler par le Propriétaire.
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="date-paiement">Date du règlement</Label>
                                <Input
                                    id="date-paiement"
                                    type="date"
                                    required
                                    value={datePaiement}
                                    onChange={(e) => setDatePaiement(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="mode">Mode</Label>
                                <Select
                                    value={modePaiement}
                                    onValueChange={(v) => setModePaiement(v as ModePaiementFournisseur)}
                                >
                                    <SelectTrigger id="mode">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(MODE_PAIEMENT_LABELS).map(([cle, libelle]) => (
                                            <SelectItem key={cle} value={cle}>
                                                {libelle}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="ref-paiement">Référence du règlement</Label>
                            <Input
                                id="ref-paiement"
                                maxLength={255}
                                value={referencePaiement}
                                onChange={(e) => setReferencePaiement(e.target.value)}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setAPayer(null)}>
                                Annuler
                            </Button>
                            <Button type="submit">
                                <Wallet /> Enregistrer le règlement
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* -------------------------------------------------------------- détail */}
            <Dialog open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
                <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{detail?.commande ?? 'Devis équipement'}</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-3">
                        <p className="text-sm text-muted-foreground">
                            {detail?.fournisseur}
                            {detail?.valideur && ` · validé par ${detail.valideur}`}
                            {detail?.date_paiement && ` · réglé le ${fmtDate(detail.date_paiement)}`}
                        </p>

                        <ul className="divide-y rounded-md border">
                            {detail?.lignes.map((l) => (
                                <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                                    <div className="min-w-0">
                                        <p className="text-sm">{l.designation}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {l.quantite} × {fmtMontant(l.prix_unitaire)}
                                        </p>
                                    </div>
                                    <span className="text-sm tabular-nums">{fmtMontant(l.montant)}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="text-right text-sm tabular-nums">
                            <p className="text-muted-foreground">
                                Base : {fmtMontant(detail?.montant_base ?? 0)}
                            </p>
                            <p className="font-medium">Total : {fmtMontant(detail?.montant ?? 0)}</p>
                        </div>

                        {detail?.notes && <p className="text-sm text-muted-foreground">{detail.notes}</p>}
                        {detail?.motif_rejet && <p className="text-sm text-red-500">{detail.motif_rejet}</p>}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

DevisEquipement.layout = {
    breadcrumbs: [
        { title: 'Comptabilité', href: '/admin/comptabilite' },
        { title: 'Devis équipement', href: ComptabiliteController.devisEquipements() },
    ],
};
