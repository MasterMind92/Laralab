import { Head, Link } from '@inertiajs/react';
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

function formatFcfa(n: number): string {
    return n.toLocaleString('fr-FR');
}

export default function ComptabiliteDashboard({ kpi }: { kpi: Kpi }) {
    return (
        <>
            <Head title="Comptabilité" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h1 className="text-2xl font-semibold">Comptabilité</h1>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">Encaissé ce mois-ci</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{formatFcfa(kpi.ca_encaisse_mois)} <span className="text-base font-normal text-muted-foreground">FCFA</span></div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">Dépenses ce mois-ci</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{formatFcfa(kpi.depenses_mois)} <span className="text-base font-normal text-muted-foreground">FCFA</span></div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">Achats à valider</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{kpi.achats_a_valider}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">Créances clients</CardTitle>
                            <CardDescription>Solde restant dû, factures validées</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{formatFcfa(kpi.creances)} <span className="text-base font-normal text-muted-foreground">FCFA</span></div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">Dettes fournisseur</CardTitle>
                            <CardDescription>Achats validés, pas encore réglés</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{formatFcfa(kpi.dettes_fournisseur)} <span className="text-base font-normal text-muted-foreground">FCFA</span></div>
                        </CardContent>
                    </Card>
                </div>

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
