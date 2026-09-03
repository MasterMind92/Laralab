import { Head, router, useForm } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import DommageController from '@/actions/App/Http/Controllers/DommageController';
import FactureController from '@/actions/App/Http/Controllers/FactureController';
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

type Equipement = { id: number; nom: string };

type DommageResume = {
    id: number;
    description: string;
    montant: string | null;
    equipement: Equipement | null;
};

type SejourRow = {
    id: number;
    date_entree: string;
    date_sortie: string | null;
    appartement: { id: number; numero: string; equipements: Equipement[] } | null;
    client: { nom: string; prenom: string } | null;
    dommages: DommageResume[];
    facture: {
        id: number;
        statut: StatutFacture;
        montant_ttc: string;
        motif_rejet: string | null;
        devis: DevisData;
    } | null;
};

const STATUT_LABELS: Record<StatutFacture, string> = {
    brouillon: 'Brouillon',
    validee: 'Validée',
    payee: 'Payée',
    annulee: 'Annulée',
};

const STATUT_VARIANTS: Record<StatutFacture, 'default' | 'secondary' | 'destructive'> = {
    brouillon: 'secondary',
    validee: 'default',
    payee: 'default',
    annulee: 'destructive',
};

const AUCUN_EQUIPEMENT = '__aucun__';

function fmt(d: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function montantDommages(dommages: DommageResume[]): number {
    return dommages.reduce((total, d) => total + Number(d.montant ?? 0), 0);
}

export default function DevisIndex({ sejours }: { sejours: SejourRow[] }) {
    const [dommagesTarget, setDommagesTarget] = useState<SejourRow | null>(null);

    const dommageForm = useForm({ equipement_id: '', description: '', montant: '' });

    function generer(sejour: SejourRow) {
        router.post(FactureController.generer(sejour.id).url, {}, { preserveScroll: true, preserveState: true });
    }

    function ouvrirApercu(sejour: SejourRow) {
        window.open(FactureController.imprimer(sejour.id).url, '_blank', 'noopener');
    }

    function telechargerPdf(sejour: SejourRow) {
        window.location.href = FactureController.telechargerPdf(sejour.id).url;
    }

    function submitDommage(e: FormEvent) {
        e.preventDefault();
        if (!dommagesTarget) return;
        dommageForm.post(DommageController.store(dommagesTarget.id).url, {
            preserveScroll: true,
            onSuccess: () => dommageForm.reset(),
        });
    }

    function supprimerDommage(dommage: DommageResume) {
        if (!confirm(`Supprimer le dommage "${dommage.description}" ?`)) return;
        router.delete(DommageController.destroy(dommage.id).url, { preserveScroll: true });
    }

    const columns: ColumnDef<SejourRow>[] = [
        {
            id: 'appartement',
            header: 'Appartement',
            accessorFn: (s) => s.appartement?.numero ?? '',
        },
        {
            id: 'client',
            header: 'Client',
            accessorFn: (s) => (s.client ? `${s.client.nom} ${s.client.prenom}` : ''),
        },
        {
            id: 'sejour',
            header: 'Séjour',
            cell: ({ row }) => `${fmt(row.original.date_entree)} → ${fmt(row.original.date_sortie)}`,
        },
        {
            id: 'dommages',
            header: 'Dommages',
            cell: ({ row }) => {
                const { dommages } = row.original;
                if (dommages.length === 0) return '—';
                return `${dommages.length} (${montantDommages(dommages).toLocaleString('fr-FR')} FCFA)`;
            },
        },
        {
            id: 'statut',
            header: 'Devis',
            cell: ({ row }) => {
                const facture = row.original.facture;
                if (!facture) return <span className="text-muted-foreground text-sm">Aucun</span>;
                return (
                    <div>
                        <Badge variant={STATUT_VARIANTS[facture.statut]}>{STATUT_LABELS[facture.statut]}</Badge>
                        {facture.statut === 'annulee' && facture.motif_rejet && (
                            <p className="text-muted-foreground mt-1 max-w-48 text-xs">Motif : {facture.motif_rejet}</p>
                        )}
                    </div>
                );
            },
        },
        {
            id: 'montant',
            header: 'Montant TTC',
            cell: ({ row }) =>
                row.original.facture ? `${Number(row.original.facture.montant_ttc).toLocaleString('fr-FR')} FCFA` : '—',
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const sejour = row.original;
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
                            <DropdownMenuItem onClick={() => generer(sejour)}>
                                {sejour.facture ? 'Régénérer le devis' : 'Générer le devis'}
                            </DropdownMenuItem>
                            {sejour.facture && (
                                <>
                                    <DropdownMenuItem onClick={() => ouvrirApercu(sejour)}>
                                        Aperçu / imprimer (nouvel onglet)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => telechargerPdf(sejour)}>
                                        Télécharger le PDF
                                    </DropdownMenuItem>
                                </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDommagesTarget(sejour)}>Gérer les dommages</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    return (
        <>
            <Head title="Devis du séjour" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h1 className="text-2xl font-semibold">Devis du séjour</h1>
                <DataTable columns={columns} data={sejours} searchPlaceholder="Rechercher un client, un appartement..." />
            </div>

            <Dialog open={dommagesTarget !== null} onOpenChange={(open) => !open && setDommagesTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Dommages — {dommagesTarget?.appartement?.numero} — {dommagesTarget?.client?.nom}{' '}
                            {dommagesTarget?.client?.prenom}
                        </DialogTitle>
                    </DialogHeader>
                    {dommagesTarget && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                {dommagesTarget.dommages.length === 0 && (
                                    <p className="text-muted-foreground text-sm">Aucun dommage enregistré.</p>
                                )}
                                {dommagesTarget.dommages.map((d) => (
                                    <div key={d.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                                        <div>
                                            <p>{d.description}</p>
                                            {d.equipement && (
                                                <p className="text-muted-foreground text-xs">Équipement : {d.equipement.nom}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span>{d.montant ? `${Number(d.montant).toLocaleString('fr-FR')} FCFA` : '—'}</span>
                                            <Button variant="ghost" size="sm" onClick={() => supprimerDommage(d)}>
                                                Retirer
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={submitDommage} className="space-y-3 border-t pt-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="dommage_equipement">Équipement concerné (optionnel)</Label>
                                    <Select
                                        value={dommageForm.data.equipement_id || AUCUN_EQUIPEMENT}
                                        onValueChange={(value) =>
                                            dommageForm.setData('equipement_id', value === AUCUN_EQUIPEMENT ? '' : value)
                                        }
                                    >
                                        <SelectTrigger id="dommage_equipement">
                                            <SelectValue placeholder="Aucun équipement précis" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={AUCUN_EQUIPEMENT}>Aucun équipement précis</SelectItem>
                                            {dommagesTarget.appartement?.equipements.map((eq) => (
                                                <SelectItem key={eq.id} value={String(eq.id)}>
                                                    {eq.nom}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="dommage_description">Description</Label>
                                    <Input
                                        id="dommage_description"
                                        value={dommageForm.data.description}
                                        onChange={(e) => dommageForm.setData('description', e.target.value)}
                                    />
                                    {dommageForm.errors.description && (
                                        <p className="text-destructive text-sm">{dommageForm.errors.description}</p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="dommage_montant">Montant (FCFA)</Label>
                                    <Input
                                        id="dommage_montant"
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={dommageForm.data.montant}
                                        onChange={(e) => dommageForm.setData('montant', e.target.value)}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={dommageForm.processing}>
                                        {dommageForm.processing ? 'Ajout...' : 'Ajouter le dommage'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

DevisIndex.layout = {
    breadcrumbs: [{ title: 'Devis du séjour', href: FactureController.index() }],
};
