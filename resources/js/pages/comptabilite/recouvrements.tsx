import { Head, router } from '@inertiajs/react';
import { PhoneCall, Wallet } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import ComptabiliteController from '@/actions/App/Http/Controllers/ComptabiliteController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { CANAL_LABELS, fmtDate, fmtMontant } from './shared';
import type { CanalRelance, Employe } from './shared';

/**
 * Recouvrements — les factures client impayées et l'historique des relances
 * (Phase 06, étape B).
 *
 * Chaque relance est enregistrée plutôt que simplement envoyée : sans trace, on relance
 * trois fois le même client la même semaine sans le savoir, et on ne sait pas répondre à
 * la seule question qui compte devant un impayé ancien — « qu'a-t-on déjà tenté ? ».
 *
 * Les plus anciennes échéances d'abord : ce sont elles qui coûtent, pas les dernières
 * émises.
 */
const TOUS = '__tous__';
const AUCUN = '__aucun__';

type RelanceRow = {
    id: number;
    date_relance: string | null;
    canal: CanalRelance;
    note: string | null;
    solde_restant: number;
    employe: string | null;
};

type FactureImpayee = {
    id: number;
    numero_facture: string | null;
    montant_ttc: number;
    montant_paye: number;
    solde_restant: number;
    date_edition: string | null;
    date_echeance: string | null;
    jours_de_retard: number;
    en_retard: boolean;
    client: {
        nom: string;
        email: string | null;
        telephone: string | null;
    } | null;
    relances: RelanceRow[];
};

export default function Recouvrements({
    factures,
    employes,
    total_du: totalDu,
    filters,
}: {
    factures: FactureImpayee[];
    employes: Employe[];
    total_du: number;
    filters: { etat?: 'en_retard' | 'a_echoir' | null };
}) {
    const [etat, setEtat] = useState<string>(filters.etat ?? TOUS);

    const [active, setActive] = useState<FactureImpayee | null>(null);
    const [dateRelance, setDateRelance] = useState('');
    const [canal, setCanal] = useState<CanalRelance>('telephone');
    const [note, setNote] = useState('');
    const [employeId, setEmployeId] = useState(AUCUN);

    function filtrer(choisi: string) {
        setEtat(choisi);
        router.get(
            ComptabiliteController.recouvrements().url,
            { etat: choisi === TOUS ? undefined : choisi },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    function ouvrir(facture: FactureImpayee) {
        setActive(facture);
        setDateRelance(new Date().toISOString().slice(0, 10));
        setCanal('telephone');
        setNote('');
        setEmployeId(AUCUN);
    }

    function enregistrer(e: FormEvent) {
        e.preventDefault();

        if (!active) {
            return;
        }

        router.post(
            ComptabiliteController.storeRelance(active.id).url,
            {
                date_relance: dateRelance,
                canal,
                note: note || null,
                employe_id: employeId === AUCUN ? null : Number(employeId),
            },
            { preserveScroll: true, onSuccess: () => setActive(null) },
        );
    }

    const enRetard = factures.filter((f) => f.en_retard);

    return (
        <>
            <Head title="Recouvrements" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Recouvrements
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {fmtMontant(totalDu)} à encaisser sur{' '}
                            {factures.length} facture
                            {factures.length > 1 ? 's' : ''}
                            {enRetard.length > 0 &&
                                ` · ${enRetard.length} échue${enRetard.length > 1 ? 's' : ''}`}
                        </p>
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="f-etat" className="text-xs">
                            État
                        </Label>
                        <Select value={etat} onValueChange={filtrer}>
                            <SelectTrigger id="f-etat" className="w-44">
                                <SelectValue placeholder="Toutes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TOUS}>Toutes</SelectItem>
                                <SelectItem value="en_retard">
                                    Échues
                                </SelectItem>
                                <SelectItem value="a_echoir">
                                    À échoir
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {factures.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-md border border-dashed py-16 text-center">
                        <Wallet className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm font-medium">Rien à recouvrer</p>
                        <p className="max-w-sm text-sm text-muted-foreground">
                            Toutes les factures émises sont soldées.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-3 xl:grid-cols-2">
                        {factures.map((facture) => (
                            <section
                                key={facture.id}
                                className="overflow-hidden rounded-md border"
                            >
                                <header className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-mono text-sm font-semibold">
                                            {facture.numero_facture ?? '—'}
                                        </span>
                                        {facture.en_retard ? (
                                            <Badge variant="destructive">
                                                {facture.jours_de_retard} jour
                                                {facture.jours_de_retard > 1
                                                    ? 's'
                                                    : ''}{' '}
                                                de retard
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">
                                                À échoir
                                            </Badge>
                                        )}
                                        {facture.relances.length > 0 && (
                                            <Badge variant="secondary">
                                                {facture.relances.length}{' '}
                                                relance
                                                {facture.relances.length > 1
                                                    ? 's'
                                                    : ''}
                                            </Badge>
                                        )}
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => ouvrir(facture)}
                                    >
                                        <PhoneCall className="mr-2 h-4 w-4" />
                                        Relancer
                                    </Button>
                                </header>

                                <div className="space-y-2 px-3 py-2">
                                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-medium">
                                                {facture.client?.nom ??
                                                    'Client inconnu'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {facture.client?.telephone ??
                                                    '—'}
                                                {facture.client?.email &&
                                                    ` · ${facture.client.email}`}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold tabular-nums">
                                                {fmtMontant(
                                                    facture.solde_restant,
                                                )}
                                            </p>
                                            <p className="text-xs text-muted-foreground tabular-nums">
                                                sur{' '}
                                                {fmtMontant(
                                                    facture.montant_ttc,
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-xs text-muted-foreground">
                                        Émise le {fmtDate(facture.date_edition)}{' '}
                                        · échéance{' '}
                                        {fmtDate(facture.date_echeance)}
                                    </p>

                                    {facture.relances.length > 0 && (
                                        <div className="border-t pt-2">
                                            <p className="mb-1 text-xs font-medium text-muted-foreground">
                                                Ce qui a déjà été tenté
                                            </p>
                                            <ul className="space-y-1 text-xs text-muted-foreground">
                                                {facture.relances.map((r) => (
                                                    <li key={r.id}>
                                                        {fmtDate(
                                                            r.date_relance,
                                                        )}{' '}
                                                        ·{' '}
                                                        {CANAL_LABELS[r.canal]}
                                                        {r.employe &&
                                                            ` · ${r.employe}`}
                                                        {r.note && (
                                                            <span className="text-foreground">
                                                                {' '}
                                                                — {r.note}
                                                            </span>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>

            <Dialog
                open={active !== null}
                onOpenChange={(o) => !o && setActive(null)}
            >
                <DialogContent>
                    <form onSubmit={enregistrer} className="grid gap-4">
                        <DialogHeader>
                            <DialogTitle>
                                Relancer — {active?.numero_facture}
                            </DialogTitle>
                        </DialogHeader>

                        <p className="text-sm text-muted-foreground">
                            {active?.client?.nom} ·{' '}
                            {fmtMontant(active?.solde_restant ?? 0)} restant dû.
                            {(active?.relances.length ?? 0) > 0 &&
                                ` ${active?.relances.length} relance(s) déjà enregistrée(s).`}
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="date-relance">Date</Label>
                                <Input
                                    id="date-relance"
                                    type="date"
                                    required
                                    value={dateRelance}
                                    onChange={(e) =>
                                        setDateRelance(e.target.value)
                                    }
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="canal">Canal</Label>
                                <Select
                                    value={canal}
                                    onValueChange={(v) =>
                                        setCanal(v as CanalRelance)
                                    }
                                >
                                    <SelectTrigger id="canal">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(CANAL_LABELS).map(
                                            ([cle, libelle]) => (
                                                <SelectItem
                                                    key={cle}
                                                    value={cle}
                                                >
                                                    {libelle}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="employe">Par</Label>
                            <Select
                                value={employeId}
                                onValueChange={setEmployeId}
                            >
                                <SelectTrigger id="employe">
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
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="note">
                                Ce qui a été dit ou convenu
                            </Label>
                            <textarea
                                id="note"
                                rows={3}
                                maxLength={2000}
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                placeholder="Rappelle lundi, conteste la ligne dommages…"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
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
                            <Button type="submit">
                                Enregistrer la relance
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

Recouvrements.layout = {
    breadcrumbs: [
        { title: 'Comptabilité', href: '/admin/comptabilite' },
        {
            title: 'Recouvrements',
            href: ComptabiliteController.recouvrements(),
        },
    ],
};
