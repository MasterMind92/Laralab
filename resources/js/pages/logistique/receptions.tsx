import { Head, router } from '@inertiajs/react';
import { PackageCheck, Truck } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import LogistiqueController from '@/actions/App/Http/Controllers/LogistiqueController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { fmtDate, fmtMontant, StatutCommandeBadge } from './shared';
import type { CommandeRow, Employe } from './shared';

/**
 * Réception des commandes (Phase 10, étape B).
 *
 * Chaque saisie crée une réception DE PLUS, jamais une correction de la précédente : une
 * livraison partielle suivie de son solde doit rester lisible comme deux événements datés.
 * C'est le serveur qui en déduit le statut de la commande.
 */
const AUCUN = '__aucun__';

type LigneCommande = {
    id: number;
    designation: string;
    quantite: number;
    quantite_recue: number;
    quantite_restante: number;
};

type ReceptionFaite = {
    id: number;
    date_reception: string | null;
    receptionnaire: string | null;
    notes: string | null;
    lignes: {
        designation: string;
        quantite_recue: number;
        conforme: boolean;
        motif_ecart: string | null;
    }[];
};

type CommandeOuverte = CommandeRow & {
    lignes: LigneCommande[];
    receptions: ReceptionFaite[];
};

type Saisie = Record<
    number,
    { quantite: string; conforme: boolean; motif_ecart: string }
>;

export default function Receptions({
    commandes,
    employes,
}: {
    commandes: CommandeOuverte[];
    employes: Employe[];
}) {
    const [active, setActive] = useState<CommandeOuverte | null>(null);
    const [date, setDate] = useState('');
    const [receptionnaire, setReceptionnaire] = useState(AUCUN);
    const [notes, setNotes] = useState('');
    const [saisie, setSaisie] = useState<Saisie>({});

    function ouvrir(commande: CommandeOuverte) {
        setActive(commande);
        setDate(new Date().toISOString().slice(0, 10));
        setReceptionnaire(AUCUN);
        setNotes('');
        // Pré-rempli au reste attendu : le cas courant est la livraison complète, et
        // laisser tout à zéro obligerait à ressaisir ce que le bon de commande dit déjà.
        setSaisie(
            Object.fromEntries(
                commande.lignes.map((l) => [
                    l.id,
                    {
                        quantite: String(l.quantite_restante),
                        conforme: true,
                        motif_ecart: '',
                    },
                ]),
            ),
        );
    }

    function majLigne(
        ligneId: number,
        champ: 'quantite' | 'conforme' | 'motif_ecart',
        valeur: string | boolean,
    ) {
        setSaisie((actuelle) => ({
            ...actuelle,
            [ligneId]: { ...actuelle[ligneId], [champ]: valeur },
        }));
    }

    function enregistrer(e: FormEvent) {
        e.preventDefault();

        if (!active) {
            return;
        }

        router.post(
            LogistiqueController.storeReception(active.id).url,
            {
                date_reception: date,
                receptionnaire_employe_id:
                    receptionnaire === AUCUN ? null : Number(receptionnaire),
                notes: notes || null,
                lignes: active.lignes.map((l) => ({
                    commande_ligne_id: l.id,
                    quantite_recue: Number(saisie[l.id]?.quantite ?? 0),
                    conforme: saisie[l.id]?.conforme ?? true,
                    motif_ecart: saisie[l.id]?.motif_ecart || null,
                })),
            },
            { preserveScroll: true, onSuccess: () => setActive(null) },
        );
    }

    const totalSaisi = active
        ? active.lignes.reduce(
              (somme, l) => somme + Number(saisie[l.id]?.quantite ?? 0),
              0,
          )
        : 0;

    return (
        <>
            <Head title="Réception des commandes" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Réception</h1>
                    <p className="text-sm text-muted-foreground">
                        {commandes.length} commande
                        {commandes.length > 1 ? 's' : ''} en attente de
                        livraison
                    </p>
                </div>

                {commandes.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-md border border-dashed py-16 text-center">
                        <Truck className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm font-medium">
                            Rien à réceptionner
                        </p>
                        <p className="max-w-sm text-sm text-muted-foreground">
                            Une commande n'attend de livraison qu'une fois
                            marquée envoyée au fournisseur.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 xl:grid-cols-2">
                        {commandes.map((commande) => {
                            const restant = commande.lignes.reduce(
                                (s, l) => s + l.quantite_restante,
                                0,
                            );

                            return (
                                <section
                                    key={commande.id}
                                    className="overflow-hidden rounded-md border"
                                >
                                    <header className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-mono text-sm font-semibold">
                                                {commande.reference}
                                            </span>
                                            <StatutCommandeBadge
                                                statut={commande.statut}
                                            />
                                            <span className="text-xs text-muted-foreground">
                                                {commande.fournisseur?.nom} ·{' '}
                                                {fmtMontant(
                                                    commande.montant_total,
                                                )}
                                            </span>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => ouvrir(commande)}
                                        >
                                            <PackageCheck className="mr-2 h-4 w-4" />
                                            Saisir une réception
                                        </Button>
                                    </header>

                                    <div className="px-3 py-2">
                                        <p className="mb-2 text-xs text-muted-foreground">
                                            Livraison prévue le{' '}
                                            {fmtDate(
                                                commande.date_livraison_prevue,
                                            )}{' '}
                                            · {restant} article
                                            {restant > 1 ? 's' : ''} encore
                                            attendu{restant > 1 ? 's' : ''}
                                        </p>

                                        <ul className="divide-y text-sm">
                                            {commande.lignes.map((ligne) => (
                                                <li
                                                    key={ligne.id}
                                                    className="flex items-baseline justify-between gap-3 py-1.5"
                                                >
                                                    <span>
                                                        {ligne.designation}
                                                    </span>
                                                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                                                        {ligne.quantite_recue} /{' '}
                                                        {ligne.quantite}
                                                        {ligne.quantite_restante ===
                                                            0 && (
                                                            <Badge
                                                                variant="secondary"
                                                                className="ml-2"
                                                            >
                                                                Soldée
                                                            </Badge>
                                                        )}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>

                                        {commande.receptions.length > 0 && (
                                            <div className="mt-3 border-t pt-2">
                                                <p className="mb-1 text-xs font-medium text-muted-foreground">
                                                    Livraisons déjà reçues
                                                </p>
                                                <ul className="space-y-1 text-xs text-muted-foreground">
                                                    {commande.receptions.map(
                                                        (r) => (
                                                            <li key={r.id}>
                                                                {fmtDate(
                                                                    r.date_reception,
                                                                )}{' '}
                                                                —{' '}
                                                                {r.lignes
                                                                    .map(
                                                                        (l) =>
                                                                            `${l.designation} × ${l.quantite_recue}${l.conforme ? '' : ' (non conforme)'}`,
                                                                    )
                                                                    .join(', ')}
                                                                {r.receptionnaire &&
                                                                    ` · ${r.receptionnaire}`}
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ------------------------------------------------ saisie de réception */}
            <Dialog
                open={active !== null}
                onOpenChange={(o) => !o && setActive(null)}
            >
                <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                    <form onSubmit={enregistrer} className="grid gap-4">
                        <DialogHeader>
                            <DialogTitle>
                                Réception — {active?.reference}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="date">Date de réception</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    required
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="receptionnaire">
                                    Réceptionnaire
                                </Label>
                                <Select
                                    value={receptionnaire}
                                    onValueChange={setReceptionnaire}
                                >
                                    <SelectTrigger id="receptionnaire">
                                        <SelectValue placeholder="Aucun" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={AUCUN}>
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
                        </div>

                        <div className="grid gap-3">
                            <Label>Ce qui est arrivé au quai</Label>
                            {active?.lignes.map((ligne) => (
                                <div
                                    key={ligne.id}
                                    className="grid gap-2 rounded-md border p-3"
                                >
                                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                                        <span className="text-sm font-medium">
                                            {ligne.designation}
                                        </span>
                                        <span className="text-xs text-muted-foreground tabular-nums">
                                            déjà reçu {ligne.quantite_recue} /{' '}
                                            {ligne.quantite}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap items-end gap-3">
                                        <div className="grid gap-1">
                                            <span className="text-xs text-muted-foreground">
                                                Quantité reçue
                                            </span>
                                            <Input
                                                type="number"
                                                min={0}
                                                max={9999}
                                                className="w-28"
                                                value={
                                                    saisie[ligne.id]
                                                        ?.quantite ?? '0'
                                                }
                                                onChange={(e) =>
                                                    majLigne(
                                                        ligne.id,
                                                        'quantite',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <label className="flex items-center gap-2 pb-2 text-sm">
                                            <Checkbox
                                                checked={
                                                    saisie[ligne.id]
                                                        ?.conforme ?? true
                                                }
                                                onCheckedChange={(c) =>
                                                    majLigne(
                                                        ligne.id,
                                                        'conforme',
                                                        c === true,
                                                    )
                                                }
                                            />
                                            Conforme
                                        </label>
                                    </div>

                                    {saisie[ligne.id]?.conforme === false && (
                                        <Input
                                            placeholder="Motif de l'écart (obligatoire à l'usage)"
                                            maxLength={500}
                                            value={
                                                saisie[ligne.id]?.motif_ecart ??
                                                ''
                                            }
                                            onChange={(e) =>
                                                majLigne(
                                                    ligne.id,
                                                    'motif_ecart',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    )}
                                </div>
                            ))}
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
                                onClick={() => setActive(null)}
                            >
                                Annuler
                            </Button>
                            <Button type="submit" disabled={totalSaisi === 0}>
                                Enregistrer la réception
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

Receptions.layout = {
    breadcrumbs: [
        { title: 'Logistique', href: '/admin/logistique' },
        { title: 'Réception', href: LogistiqueController.receptions() },
    ],
};
