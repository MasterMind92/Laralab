import { Head, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import ComptabiliteController from '@/actions/App/Http/Controllers/ComptabiliteController';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CATEGORIE_LABELS, fmtDate, fmtMontant } from './shared';
import type { CategorieCharge } from './shared';

/**
 * États financiers — compte de résultat simplifié (Phase 06, étape B).
 *
 * Comptabilité de CAISSE et non d'engagement : on somme ce qui est réellement entré et
 * réellement sorti, pas ce qui a été facturé. C'est ce que veut un exploitant qui se
 * demande si le mois a été bon. L'engagement se lit à côté, sur les deux files d'attente —
 * créances à recouvrer, factures fournisseur à régler — pour que la lecture en caisse ne
 * masque pas ce qui est dû de part et d'autre.
 *
 * Les montants IMMOBILISÉS sont sortis du résultat et présentés séparément : un
 * climatiseur payé ce mois-ci n'est pas une charge du mois, il est à l'actif. C'est toute
 * la raison d'être du champ `nature` sur les lignes de facture fournisseur.
 *
 * AUCUN GRAPHIQUE ici, délibérément : les visualisations sont le périmètre de la Phase 07,
 * et deux lectures concurrentes des mêmes chiffres seraient pires qu'une seule tardive.
 */
type Resultat = {
    recettes: number;
    charges: number;
    marge: number;
    immobilise: number;
};

export default function EtatsFinanciers({
    periode,
    resultat,
    charges_par_categorie: chargesParCategorie,
    recettes_par_mode: recettesParMode,
    engagements,
}: {
    periode: { du: string; au: string };
    resultat: Resultat;
    charges_par_categorie: {
        categorie: CategorieCharge;
        total: number;
        nombre: number;
    }[];
    recettes_par_mode: { mode: string; total: number }[];
    engagements: { creances: number; dettes_fournisseur: number };
}) {
    const [du, setDu] = useState(periode.du);
    const [au, setAu] = useState(periode.au);

    function filtrer(e: FormEvent) {
        e.preventDefault();
        router.get(
            ComptabiliteController.etatsFinanciers().url,
            { du, au },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    const beneficiaire = resultat.marge >= 0;
    const totalCharges = chargesParCategorie.reduce((s, c) => s + c.total, 0);

    return (
        <>
            <Head title="États financiers" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">États financiers</h1>
                    <p className="text-sm text-muted-foreground">
                        Du {fmtDate(periode.du)} au {fmtDate(periode.au)} —
                        encaissements et décaissements réels
                    </p>
                </div>

                <form
                    onSubmit={filtrer}
                    className="grid grid-cols-2 gap-3 rounded-md border p-3 md:grid-cols-4 md:items-end"
                >
                    <div className="grid gap-1.5">
                        <Label htmlFor="du">Du</Label>
                        <Input
                            id="du"
                            type="date"
                            value={du}
                            onChange={(e) => setDu(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="au">Au</Label>
                        <Input
                            id="au"
                            type="date"
                            value={au}
                            onChange={(e) => setAu(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit">Recalculer</Button>
                    </div>
                </form>

                {/* ------------------------------------------ compte de résultat */}
                <section className="overflow-hidden rounded-md border">
                    <header className="border-b bg-muted/40 px-3 py-2">
                        <h2 className="text-sm font-semibold">
                            Compte de résultat simplifié
                        </h2>
                    </header>

                    <dl className="divide-y">
                        <div className="flex items-baseline justify-between px-4 py-3">
                            <dt className="text-sm">Recettes encaissées</dt>
                            <dd className="text-lg font-medium tabular-nums">
                                {fmtMontant(resultat.recettes)}
                            </dd>
                        </div>
                        <div className="flex items-baseline justify-between px-4 py-3">
                            <dt className="text-sm">Charges décaissées</dt>
                            <dd className="text-lg font-medium tabular-nums">
                                − {fmtMontant(resultat.charges)}
                            </dd>
                        </div>
                        <div className="flex items-baseline justify-between bg-muted/30 px-4 py-3">
                            <dt className="text-sm font-semibold">
                                Marge sur la période
                            </dt>
                            <dd
                                className={
                                    beneficiaire
                                        ? 'text-2xl font-semibold tabular-nums'
                                        : 'text-2xl font-semibold text-destructive tabular-nums'
                                }
                            >
                                {fmtMontant(resultat.marge)}
                            </dd>
                        </div>
                    </dl>

                    {resultat.immobilise > 0 && (
                        <div className="border-t px-4 py-3">
                            <p className="text-sm">
                                <span className="font-medium">
                                    {fmtMontant(resultat.immobilise)}
                                </span>{' '}
                                immobilisés sur la période —{' '}
                                <span className="text-muted-foreground">
                                    hors résultat. Ces biens durables entrent à
                                    l'actif ; les porter ici imputerait à un
                                    mois ce qui servira plusieurs années.
                                </span>
                            </p>
                        </div>
                    )}
                </section>

                <div className="grid gap-4 lg:grid-cols-2">
                    {/* --------------------------------------- charges par famille */}
                    <section className="overflow-hidden rounded-md border">
                        <header className="flex items-baseline justify-between border-b bg-muted/40 px-3 py-2">
                            <h2 className="text-sm font-semibold">
                                Charges par famille
                            </h2>
                            <span className="text-xs text-muted-foreground tabular-nums">
                                {fmtMontant(totalCharges)}
                            </span>
                        </header>

                        {chargesParCategorie.length === 0 ? (
                            <p className="p-6 text-center text-sm text-muted-foreground">
                                Aucune charge sur la période.
                            </p>
                        ) : (
                            <ul className="divide-y">
                                {chargesParCategorie.map((c) => (
                                    <li
                                        key={c.categorie}
                                        className="flex items-center gap-3 px-3 py-2"
                                    >
                                        <span className="w-44 shrink-0 text-sm">
                                            {CATEGORIE_LABELS[c.categorie] ??
                                                c.categorie}
                                        </span>
                                        {/* Barre proportionnelle : la répartition se lit
                                            d'un coup d'oeil sans devenir un graphique. */}
                                        <span
                                            className="h-2 rounded-full bg-primary/70"
                                            style={{
                                                width: `${Math.round((c.total / totalCharges) * 100)}%`,
                                                minWidth: '4px',
                                            }}
                                            aria-hidden
                                        />
                                        <span className="ml-auto shrink-0 text-sm tabular-nums">
                                            {fmtMontant(c.total)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {/* ------------------------------------------------ engagements */}
                    <section className="overflow-hidden rounded-md border">
                        <header className="border-b bg-muted/40 px-3 py-2">
                            <h2 className="text-sm font-semibold">
                                Engagements en cours
                            </h2>
                        </header>

                        <dl className="divide-y">
                            <div className="flex items-baseline justify-between px-4 py-3">
                                <dt className="text-sm">
                                    Créances clients
                                    <span className="block text-xs text-muted-foreground">
                                        Facturé, pas encore encaissé
                                    </span>
                                </dt>
                                <dd className="text-sm font-medium tabular-nums">
                                    {fmtMontant(engagements.creances)}
                                </dd>
                            </div>
                            <div className="flex items-baseline justify-between px-4 py-3">
                                <dt className="text-sm">
                                    Dettes fournisseur
                                    <span className="block text-xs text-muted-foreground">
                                        Validé, pas encore réglé
                                    </span>
                                </dt>
                                <dd className="text-sm font-medium tabular-nums">
                                    {fmtMontant(engagements.dettes_fournisseur)}
                                </dd>
                            </div>
                            <div className="flex items-baseline justify-between bg-muted/30 px-4 py-3">
                                <dt className="text-sm font-semibold">
                                    Position nette
                                </dt>
                                <dd className="text-sm font-semibold tabular-nums">
                                    {fmtMontant(
                                        engagements.creances -
                                            engagements.dettes_fournisseur,
                                    )}
                                </dd>
                            </div>
                        </dl>

                        {recettesParMode.length > 0 && (
                            <div className="border-t px-3 py-2">
                                <p className="mb-1 text-xs font-medium text-muted-foreground">
                                    Encaissements par mode
                                </p>
                                <ul className="space-y-0.5 text-xs text-muted-foreground">
                                    {recettesParMode.map((r) => (
                                        <li
                                            key={r.mode}
                                            className="flex justify-between"
                                        >
                                            <span>{r.mode}</span>
                                            <span className="tabular-nums">
                                                {fmtMontant(r.total)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}

EtatsFinanciers.layout = {
    breadcrumbs: [
        { title: 'Comptabilité', href: '/admin/comptabilite' },
        {
            title: 'États financiers',
            href: ComptabiliteController.etatsFinanciers(),
        },
    ],
};
