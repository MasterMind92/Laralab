import { Head, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import LogistiqueController from '@/actions/App/Http/Controllers/LogistiqueController';
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
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { fmtDate, STATUT_EQUIPEMENT_LABELS } from './shared';
import type { AppartementRef, Employe, StatutEquipement } from './shared';

/**
 * Affectation de l'équipement (Phase 10, étape B) — dernier maillon de la chaîne.
 *
 * L'écran ne montre QUE l'équipement entré par la chaîne d'approvisionnement. Les lignes
 * au statut « stock » antérieures à cette phase sont en réalité le catalogue d'agréments
 * montré au client sur le portail : les proposer ici reviendrait à laisser poser une ligne
 * de catalogue dans un appartement. Le parc historique se gère depuis l'écran « Parc
 * équipements » de la Maintenance.
 */
type EquipementRow = {
    id: number;
    nom: string;
    type: string;
    statut: StatutEquipement;
    numero_serie: string | null;
    date_achat: string | null;
    garantie_fin: string | null;
    sous_garantie: boolean;
    appartement: AppartementRef | null;
    employe: { id: number; nom: string; prenom: string } | null;
    commande: string | null;
};

type Cible = 'appartement' | 'employe' | 'stock';

export default function Affectation({
    equipements,
    appartements,
    employes,
}: {
    equipements: EquipementRow[];
    appartements: AppartementRef[];
    employes: Employe[];
}) {
    const [active, setActive] = useState<EquipementRow | null>(null);
    const [cible, setCible] = useState<Cible>('appartement');
    const [appartementId, setAppartementId] = useState('');
    const [employeId, setEmployeId] = useState('');

    function ouvrir(equipement: EquipementRow) {
        setActive(equipement);
        setCible(equipement.employe ? 'employe' : 'appartement');
        setAppartementId(
            equipement.appartement
                ? String(equipement.appartement.id)
                : appartements[0]
                  ? String(appartements[0].id)
                  : '',
        );
        setEmployeId(
            equipement.employe
                ? String(equipement.employe.id)
                : employes[0]
                  ? String(employes[0].id)
                  : '',
        );
    }

    function affecter(e: FormEvent) {
        e.preventDefault();

        if (!active) {
            return;
        }

        router.patch(
            LogistiqueController.affecter(active.id).url,
            {
                cible,
                appartement_id:
                    cible === 'appartement' ? Number(appartementId) : null,
                employe_id: cible === 'employe' ? Number(employeId) : null,
            },
            { preserveScroll: true, onSuccess: () => setActive(null) },
        );
    }

    function remettreEnStock(equipement: EquipementRow) {
        router.patch(
            LogistiqueController.affecter(equipement.id).url,
            { cible: 'stock', appartement_id: null, employe_id: null },
            { preserveScroll: true },
        );
    }

    const columns: ColumnDef<EquipementRow>[] = [
        {
            accessorKey: 'nom',
            header: 'Équipement',
            cell: ({ row }) => (
                <div className="space-y-0.5">
                    <p className="text-sm font-medium">{row.original.nom}</p>
                    <p className="text-xs text-muted-foreground">
                        {row.original.type}
                        {row.original.numero_serie &&
                            ` · nº ${row.original.numero_serie}`}
                    </p>
                </div>
            ),
        },
        {
            id: 'statut',
            header: 'Statut',
            accessorFn: (e) => STATUT_EQUIPEMENT_LABELS[e.statut],
            cell: ({ row }) => (
                <Badge
                    variant={
                        row.original.statut === 'affecte'
                            ? 'default'
                            : row.original.statut === 'stock'
                              ? 'outline'
                              : 'destructive'
                    }
                >
                    {STATUT_EQUIPEMENT_LABELS[row.original.statut]}
                </Badge>
            ),
        },
        {
            id: 'emplacement',
            header: 'Emplacement',
            accessorFn: (e) =>
                e.appartement?.numero ??
                (e.employe ? `${e.employe.prenom} ${e.employe.nom}` : ''),
            cell: ({ row }) => {
                const { appartement, employe } = row.original;

                if (appartement) {
                    return (
                        <span className="text-sm">
                            Appartement {appartement.numero}
                        </span>
                    );
                }

                if (employe) {
                    return (
                        <span className="text-sm">
                            {employe.prenom} {employe.nom}
                        </span>
                    );
                }

                return (
                    <span className="text-xs text-muted-foreground">
                        Magasin
                    </span>
                );
            },
        },
        {
            id: 'garantie',
            header: 'Garantie',
            accessorFn: (e) => e.garantie_fin ?? '',
            cell: ({ row }) =>
                row.original.garantie_fin ? (
                    <span className="text-xs">
                        {row.original.sous_garantie ? 'Jusqu’au ' : 'Échue le '}
                        {fmtDate(row.original.garantie_fin)}
                    </span>
                ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                ),
        },
        {
            id: 'commande',
            header: 'Origine',
            accessorFn: (e) => e.commande ?? '',
            cell: ({ row }) => (
                <span className="font-mono text-xs text-muted-foreground">
                    {row.original.commande ?? '—'}
                </span>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const equipement = row.original;
                const gereParMaintenance =
                    equipement.statut === 'en_panne' ||
                    equipement.statut === 'reforme';

                if (gereParMaintenance) {
                    return (
                        <span className="text-xs text-muted-foreground">
                            Maintenance
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
                                onClick={() => ouvrir(equipement)}
                            >
                                {equipement.statut === 'stock'
                                    ? 'Affecter…'
                                    : 'Réaffecter…'}
                            </DropdownMenuItem>
                            {equipement.statut === 'affecte' && (
                                <DropdownMenuItem
                                    onClick={() => remettreEnStock(equipement)}
                                >
                                    Remettre en stock
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    const enStock = equipements.filter((e) => e.statut === 'stock').length;

    return (
        <>
            <Head title="Affectation des équipements" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Affectation des équipements
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {equipements.length} pièce
                        {equipements.length > 1 ? 's' : ''} acquise
                        {equipements.length > 1 ? 's' : ''} par la Logistique ·{' '}
                        {enStock} en magasin
                    </p>
                </div>

                {equipements.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-md border border-dashed py-16 text-center">
                        <p className="text-sm font-medium">
                            Aucun équipement acquis
                        </p>
                        <p className="max-w-md text-sm text-muted-foreground">
                            Cet écran ne montre que les pièces entrées par la
                            chaîne d'approvisionnement. Le parc existant se gère
                            depuis « Parc équipements », côté Maintenance.
                        </p>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={equipements}
                        searchPlaceholder="Rechercher un équipement..."
                    />
                )}
            </div>

            <Dialog
                open={active !== null}
                onOpenChange={(o) => !o && setActive(null)}
            >
                <DialogContent>
                    <form onSubmit={affecter} className="grid gap-4">
                        <DialogHeader>
                            <DialogTitle>Affecter — {active?.nom}</DialogTitle>
                        </DialogHeader>

                        <div className="grid gap-1.5">
                            <Label htmlFor="cible">Destination</Label>
                            <Select
                                value={cible}
                                onValueChange={(v) => setCible(v as Cible)}
                            >
                                <SelectTrigger id="cible">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="appartement">
                                        Un appartement
                                    </SelectItem>
                                    <SelectItem value="employe">
                                        Un employé
                                    </SelectItem>
                                    <SelectItem value="stock">
                                        Retour en magasin
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {cible === 'appartement' && (
                            <div className="grid gap-1.5">
                                <Label htmlFor="appartement">Appartement</Label>
                                <Select
                                    value={appartementId}
                                    onValueChange={setAppartementId}
                                >
                                    <SelectTrigger id="appartement">
                                        <SelectValue placeholder="Choisir" />
                                    </SelectTrigger>
                                    <SelectContent>
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
                        )}

                        {cible === 'employe' && (
                            <div className="grid gap-1.5">
                                <Label htmlFor="employe">Employé</Label>
                                <Select
                                    value={employeId}
                                    onValueChange={setEmployeId}
                                >
                                    <SelectTrigger id="employe">
                                        <SelectValue placeholder="Choisir" />
                                    </SelectTrigger>
                                    <SelectContent>
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
                        )}

                        <p className="text-xs text-muted-foreground">
                            Une pièce ne peut être qu'à un seul endroit :
                            choisir une destination efface la précédente.
                        </p>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setActive(null)}
                            >
                                Annuler
                            </Button>
                            <Button type="submit">Affecter</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

Affectation.layout = {
    breadcrumbs: [
        { title: 'Logistique', href: '/admin/logistique' },
        { title: 'Affectation', href: LogistiqueController.affectation() },
    ],
};
