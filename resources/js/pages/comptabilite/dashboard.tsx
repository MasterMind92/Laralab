import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, ArrowDownToLine, FileStack, Landmark, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type Kpi = {
    ca_encaisse_mois: number;
    creances: number;
    dettes_fournisseur: number;
    achats_a_valider: number;
    depenses_mois: number;
};

type StatutAchat = 'a_valider' | 'validee' | 'payee' | 'annulee';

const STATUT_LABELS: Record<StatutAchat, string> = {
    a_valider: 'À valider',
    validee: 'Validé',
    payee: 'Payé',
    annulee: 'Annulé',
};

type FactureEnRetard = {
    id: number;
    numero_facture: string | null;
    date_echeance: string | null;
    jours_de_retard: number;
    solde_restant: number;
    client: { nom: string; prenom: string } | null;
};

function formatFcfa(n: number): string {
    return n.toLocaleString('fr-FR');
}

function nomComplet(personne: { nom: string; prenom: string } | null): string {
    return personne ? `${personne.prenom} ${personne.nom}` : 'Client supprimé';
}

export default function ComptabiliteDashboard({
    kpi,
    parStatutAchat,
    facturesEnRetard,
}: {
    kpi: Kpi;
    parStatutAchat: { statut: StatutAchat; total: number }[];
    facturesEnRetard: FactureEnRetard[];
}) {
    const totalAchats = parStatutAchat.reduce((total, ligne) => total + ligne.total, 0);

    return (
        <>
            <Head title="Comptabilité" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h1 className="text-2xl font-semibold">Comptabilité</h1>

                <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
                    <KpiCard titre="Encaissé ce mois-ci" valeur={`${formatFcfa(kpi.ca_encaisse_mois)} FCFA`} description="Tous modes confondus" icone={<ArrowDownToLine className="h-4 w-4" />} />
                    <KpiCard titre="Dépenses ce mois-ci" valeur={`${formatFcfa(kpi.depenses_mois)} FCFA`} description="Charges de l'exercice" icone={<Landmark className="h-4 w-4" />} />
                    <KpiCard titre="Achats à valider" valeur={kpi.achats_a_valider} description="File de validation" icone={<ShoppingCart className="h-4 w-4" />} alerte={kpi.achats_a_valider > 0} />
                    <KpiCard titre="Créances clients" valeur={`${formatFcfa(kpi.creances)} FCFA`} description="Solde restant dû" icone={<FileStack className="h-4 w-4" />} />
                    <KpiCard titre="Dettes fournisseur" valeur={`${formatFcfa(kpi.dettes_fournisseur)} FCFA`} description="Achats validés, pas réglés" icone={<Landmark className="h-4 w-4" />} />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Achats par statut</CardTitle>
                        <CardDescription>De la validation au règlement.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {parStatutAchat.map((ligne) => (
                            <div key={ligne.statut} className="flex items-center gap-3 text-sm">
                                <span className="w-32 shrink-0">{STATUT_LABELS[ligne.statut]}</span>
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full bg-primary"
                                        style={{ width: totalAchats ? `${(ligne.total / totalAchats) * 100}%` : '0%' }}
                                    />
                                </div>
                                <span className="w-8 text-right tabular-nums">{ligne.total}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Factures en retard — à relancer en priorité</CardTitle>
                        <CardDescription>Solde restant dû, échéance dépassée, les plus anciennes d'abord.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {facturesEnRetard.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Aucune facture en retard.</p>
                        ) : (
                            <div className="space-y-2">
                                {facturesEnRetard.map((facture) => (
                                    <div key={facture.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
                                        <div className="space-y-1">
                                            <p className="font-medium">{facture.numero_facture ?? `Facture #${facture.id}`} — {nomComplet(facture.client)}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Échéance dépassée de {facture.jours_de_retard} jour{facture.jours_de_retard > 1 ? 's' : ''} · solde {formatFcfa(facture.solde_restant)} FCFA
                                            </p>
                                        </div>
                                        <AlertTriangle className="h-4 w-4 text-destructive" />
                                    </div>
                                ))}
                                <div className="pt-2">
                                    <Button asChild variant="outline" size="sm">
                                        <Link href="/admin/recouvrements">Voir tous les retards</Link>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Accès rapides</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3 text-sm">
                        <Link href="/admin/factures" className="text-primary hover:underline">Consultation Devis</Link>
                        <Link href="/admin/entrees" className="text-primary hover:underline">Entrées</Link>
                        <Link href="/admin/sorties" className="text-primary hover:underline">Sorties</Link>
                        <Link href="/admin/recouvrements" className="text-primary hover:underline">Recouvrements factures</Link>
                        <Link href="/admin/achats" className="text-primary hover:underline">Achats</Link>
                        <Link href="/admin/etats-financiers" className="text-primary hover:underline">États Financiers</Link>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

function KpiCard({
    titre,
    valeur,
    description,
    icone,
    alerte = false,
}: {
    titre: string;
    valeur: number | string;
    description: string;
    icone: React.ReactNode;
    alerte?: boolean;
}) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm font-medium">
                    {titre}
                    <span className="text-muted-foreground">{icone}</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${alerte ? 'text-destructive' : ''}`}>{valeur}</div>
                <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
}
