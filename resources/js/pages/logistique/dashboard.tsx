import { Head, Link } from '@inertiajs/react';
import {
    Boxes,
    ClipboardCheck,
    PackageCheck,
    ShoppingCart,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import LogistiqueController from '@/actions/App/Http/Controllers/LogistiqueController';
import {
    fmtDate,
    fmtMontant,
    STATUT_COMMANDE_LABELS,
    StatutCommandeBadge,
} from './shared';
import type { CommandeRow, StatutCommande } from './shared';

/**
 * Tableau de bord du pôle Logistique (Phase 10, étape C).
 *
 * Remplace une page de démonstration entièrement en dur — taux d'occupation à 50 %,
 * chiffre d'affaires à 1 000 000, onglets inertes pointant sur des données factices.
 *
 * Volontairement modeste : quatre compteurs et les deux endroits où le travail s'accumule.
 * Les indicateurs par pôle sont le périmètre de la Phase 07, et deux tableaux de bord
 * concurrents seraient pires qu'un seul tardif. Chaque compteur est un LIEN vers l'écran
 * qui permet d'agir : un chiffre sur lequel on ne peut pas cliquer oblige à retraverser le
 * menu pour faire quoi que ce soit.
 */
type Kpi = {
    besoins_a_valider: number;
    besoins_a_commander: number;
    commandes_ouvertes: number;
    pieces_a_enregistrer: number;
};

function Compteur({
    valeur,
    libelle,
    detail,
    href,
    icone: Icone,
    accent,
}: {
    valeur: number;
    libelle: string;
    detail: string;
    href: string;
    icone: LucideIcon;
    accent: boolean;
}) {
    return (
        <Link
            href={href}
            className="flex flex-col gap-2 rounded-md border p-4 transition-colors hover:bg-muted/50"
        >
            <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{libelle}</span>
                <Icone className="h-4 w-4 text-muted-foreground" />
            </div>
            <span
                className={
                    accent && valeur > 0
                        ? 'text-3xl font-semibold text-destructive tabular-nums'
                        : 'text-3xl font-semibold tabular-nums'
                }
            >
                {valeur}
            </span>
            <span className="text-xs text-muted-foreground">{detail}</span>
        </Link>
    );
}

export default function DashboardLogistique({
    kpi,
    parStatutCommande,
    livraisons_attendues: livraisons,
    stock_disponible: stockDisponible,
}: {
    kpi: Kpi;
    parStatutCommande: { statut: StatutCommande; total: number }[];
    livraisons_attendues: CommandeRow[];
    stock_disponible: number;
}) {
    const totalCommandes = parStatutCommande.reduce((s, l) => s + l.total, 0);

    return (
        <>
            <Head title="Tableau de bord — Logistique" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Logistique</h1>
                    <p className="text-sm text-muted-foreground">
                        {stockDisponible} pièce{stockDisponible > 1 ? 's' : ''}{' '}
                        en magasin, prête{stockDisponible > 1 ? 's' : ''} à être
                        affectée{stockDisponible > 1 ? 's' : ''}
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Compteur
                        valeur={kpi.besoins_a_valider}
                        libelle="Besoins à valider"
                        detail="Soumis, en attente d'arbitrage"
                        href={
                            LogistiqueController.besoins().url +
                            '?statut=soumis'
                        }
                        icone={ClipboardCheck}
                        accent
                    />
                    <Compteur
                        valeur={kpi.besoins_a_commander}
                        libelle="Validés à commander"
                        detail="Prêts à porter sur un bon"
                        href={LogistiqueController.commandes().url}
                        icone={ShoppingCart}
                        accent={false}
                    />
                    <Compteur
                        valeur={kpi.commandes_ouvertes}
                        libelle="Commandes ouvertes"
                        detail="Ni reçues ni annulées"
                        href={LogistiqueController.receptions().url}
                        icone={PackageCheck}
                        accent={false}
                    />
                    <Compteur
                        valeur={kpi.pieces_a_enregistrer}
                        libelle="Pièces à enregistrer"
                        detail="Livrées, pas encore au parc"
                        href={LogistiqueController.enregistrement().url}
                        icone={Boxes}
                        accent
                    />
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
                    <section className="overflow-hidden rounded-md border">
                        <header className="border-b bg-muted/40 px-3 py-2">
                            <h2 className="text-sm font-semibold">
                                Livraisons attendues
                            </h2>
                        </header>

                        {livraisons.length === 0 ? (
                            <p className="p-6 text-center text-sm text-muted-foreground">
                                Aucune commande en attente de livraison.
                            </p>
                        ) : (
                            <ul className="divide-y">
                                {livraisons.map((commande) => (
                                    <li
                                        key={commande.id}
                                        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5"
                                    >
                                        <div className="min-w-0 space-y-0.5">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-mono text-sm font-medium">
                                                    {commande.reference}
                                                </span>
                                                <StatutCommandeBadge
                                                    statut={commande.statut}
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {commande.fournisseur?.nom ??
                                                    'Fournisseur inconnu'}{' '}
                                                · {commande.nb_lignes} ligne
                                                {commande.nb_lignes > 1
                                                    ? 's'
                                                    : ''}{' '}
                                                ·{' '}
                                                {fmtMontant(
                                                    commande.montant_total,
                                                )}
                                            </p>
                                        </div>
                                        <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">
                                            {commande.date_livraison_prevue
                                                ? `Prévue le ${fmtDate(commande.date_livraison_prevue)}`
                                                : 'Sans date'}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section className="overflow-hidden rounded-md border">
                        <header className="border-b bg-muted/40 px-3 py-2">
                            <h2 className="text-sm font-semibold">
                                Commandes par statut
                            </h2>
                        </header>

                        {totalCommandes === 0 ? (
                            <p className="p-6 text-center text-sm text-muted-foreground">
                                Aucune commande enregistrée.
                            </p>
                        ) : (
                            <ul className="divide-y">
                                {parStatutCommande.map(({ statut, total }) => (
                                    <li
                                        key={statut}
                                        className="flex items-center gap-3 px-3 py-2"
                                    >
                                        <span className="w-40 shrink-0 text-sm">
                                            {STATUT_COMMANDE_LABELS[statut]}
                                        </span>
                                        {/* Barre proportionnelle plutôt qu'un simple
                                            nombre : la répartition se lit d'un coup
                                            d'oeil, ce qui est tout l'intérêt de la
                                            rubrique. */}
                                        <span
                                            className="h-2 rounded-full bg-primary/70"
                                            style={{
                                                width: `${Math.round((total / totalCommandes) * 100)}%`,
                                                minWidth: total > 0 ? '4px' : 0,
                                            }}
                                            aria-hidden
                                        />
                                        <span className="ml-auto text-sm text-muted-foreground tabular-nums">
                                            {total}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}

DashboardLogistique.layout = {
    breadcrumbs: [{ title: 'Logistique', href: '/admin/logistique' }],
};
