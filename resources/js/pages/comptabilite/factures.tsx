import { Head, router, useForm } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import FactureController from '@/actions/App/Http/Controllers/FactureController';
import PaiementController from '@/actions/App/Http/Controllers/PaiementController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table/data-table';
import { type DevisData } from '@/components/devis/Devis';
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

type StatutFacture = 'brouillon' | 'validee' | 'payee' | 'annulee';

type FactureRow = {
    id: number;
    sejour_id: number;
    numero_facture: string | null;
    statut: StatutFacture;
    motif_rejet: string | null;
    montant_ttc: string;
    montant_paye: number;
    solde_restant: number;
    appartement: string | null;
    client: string | null;
    devis: DevisData;
};

const STATUT_LABELS: Record<StatutFacture, string> = {
    brouillon: 'Brouillon',
    validee: 'Validée',
    payee: 'Payée',
    annulee: 'Rejetée',
};

const STATUT_VARIANTS: Record<StatutFacture, 'default' | 'secondary' | 'destructive'> = {
    brouillon: 'secondary',
    validee: 'default',
    payee: 'default',
    annulee: 'destructive',
};

function montant(n: string | number): string {
    return `${Number(n).toLocaleString('fr-FR')} FCFA`;
}

export default function FacturesIndex({ factures }: { factures: FactureRow[] }) {
    const [rejetTarget, setRejetTarget] = useState<FactureRow | null>(null);
    const [paiementTarget, setPaiementTarget] = useState<FactureRow | null>(null);

    const rejetForm = useForm({ motif_rejet: '' });
    const paiementForm = useForm({ montant: '', mode_paiement: 'especes', reference_transaction: '' });

    function ouvrirApercu(facture: FactureRow) {
        window.open(FactureController.imprimer(facture.sejour_id).url, '_blank', 'noopener');
    }

    function valider(facture: FactureRow) {
        if (!confirm(`Valider la facture pour ${facture.appartement} — ${facture.client} ?`)) return;
        router.patch(FactureController.valider(facture.id).url, {}, { preserveScroll: true });
    }

    function submitRejet(e: FormEvent) {
        e.preventDefault();
        if (!rejetTarget) return;
        rejetForm.patch(FactureController.rejeter(rejetTarget.id).url, {
            preserveScroll: true,
            onSuccess: () => {
                rejetForm.reset();
                setRejetTarget(null);
            },
        });
    }

    function submitPaiement(e: FormEvent) {
        e.preventDefault();
        if (!paiementTarget) return;
        paiementForm.post(PaiementController.store(paiementTarget.id).url, {
            preserveScroll: true,
            onSuccess: () => {
                paiementForm.reset();
                setPaiementTarget(null);
            },
        });
    }

    function ouvrirPaiement(facture: FactureRow) {
        paiementForm.reset();
        paiementForm.setData('montant', String(facture.solde_restant));
        setPaiementTarget(facture);
    }

    const columns: ColumnDef<FactureRow>[] = [
        {
            id: 'numero',
            header: 'N°',
            accessorFn: (f) => f.numero_facture ?? `Brouillon #${f.id}`,
        },
        { accessorKey: 'appartement', header: 'Appartement' },
        { accessorKey: 'client', header: 'Client' },
        {
            id: 'statut',
            header: 'Statut',
            cell: ({ row }) => (
                <div>
                    <Badge variant={STATUT_VARIANTS[row.original.statut]}>{STATUT_LABELS[row.original.statut]}</Badge>
                    {row.original.statut === 'annulee' && row.original.motif_rejet && (
                        <p className="text-muted-foreground mt-1 max-w-48 text-xs">{row.original.motif_rejet}</p>
                    )}
                </div>
            ),
        },
        {
            id: 'montant_ttc',
            header: 'Montant TTC',
            cell: ({ row }) => montant(row.original.montant_ttc),
        },
        {
            id: 'solde',
            header: 'Payé / Solde',
            cell: ({ row }) => {
                const f = row.original;
                if (f.statut !== 'validee' && f.statut !== 'payee') return '—';
                return `${montant(f.montant_paye)} / ${montant(f.solde_restant)}`;
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const facture = row.original;
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
                            <DropdownMenuItem onClick={() => ouvrirApercu(facture)}>Aperçu / imprimer</DropdownMenuItem>
                            {facture.statut === 'brouillon' && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => valider(facture)}>Valider</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setRejetTarget(facture)}>Rejeter</DropdownMenuItem>
                                </>
                            )}
                            {facture.statut === 'validee' && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => ouvrirPaiement(facture)}>
                                        Enregistrer un paiement
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
            <Head title="Factures" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h1 className="text-2xl font-semibold">Factures</h1>
                <DataTable columns={columns} data={factures} searchPlaceholder="Rechercher un client, un appartement..." />
            </div>

            <Dialog open={rejetTarget !== null} onOpenChange={(open) => !open && setRejetTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Rejeter le devis — {rejetTarget?.appartement} — {rejetTarget?.client}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitRejet} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="motif_rejet">Motif du rejet</Label>
                            <textarea
                                id="motif_rejet"
                                rows={4}
                                className="border-input flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none"
                                value={rejetForm.data.motif_rejet}
                                onChange={(e) => rejetForm.setData('motif_rejet', e.target.value)}
                            />
                            {rejetForm.errors.motif_rejet && (
                                <p className="text-destructive text-sm">{rejetForm.errors.motif_rejet}</p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button type="submit" variant="destructive" disabled={rejetForm.processing}>
                                {rejetForm.processing ? 'Envoi...' : 'Rejeter'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={paiementTarget !== null} onOpenChange={(open) => !open && setPaiementTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Enregistrer un paiement — {paiementTarget?.appartement} — {paiementTarget?.client}
                        </DialogTitle>
                    </DialogHeader>
                    {paiementTarget && (
                        <form onSubmit={submitPaiement} className="space-y-4">
                            <p className="text-muted-foreground text-sm">
                                Solde restant : <strong>{montant(paiementTarget.solde_restant)}</strong>
                            </p>
                            <div className="grid gap-2">
                                <Label htmlFor="montant_paiement">Montant (FCFA)</Label>
                                <Input
                                    id="montant_paiement"
                                    type="number"
                                    min={0.01}
                                    max={paiementTarget.solde_restant}
                                    step="0.01"
                                    value={paiementForm.data.montant}
                                    onChange={(e) => paiementForm.setData('montant', e.target.value)}
                                />
                                {paiementForm.errors.montant && (
                                    <p className="text-destructive text-sm">{paiementForm.errors.montant}</p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="mode_paiement">Mode de paiement</Label>
                                <Select
                                    value={paiementForm.data.mode_paiement}
                                    onValueChange={(value) => paiementForm.setData('mode_paiement', value)}
                                >
                                    <SelectTrigger id="mode_paiement">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="especes">Espèces</SelectItem>
                                        <SelectItem value="cb">Carte bancaire</SelectItem>
                                        <SelectItem value="virement">Virement</SelectItem>
                                        <SelectItem value="mobile_money">Mobile money</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="reference_transaction">Référence (optionnel)</Label>
                                <Input
                                    id="reference_transaction"
                                    value={paiementForm.data.reference_transaction}
                                    onChange={(e) => paiementForm.setData('reference_transaction', e.target.value)}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={paiementForm.processing}>
                                    {paiementForm.processing ? 'Enregistrement...' : 'Enregistrer le paiement'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

FacturesIndex.layout = {
    breadcrumbs: [{ title: 'Factures', href: FactureController.indexCompta() }],
};
