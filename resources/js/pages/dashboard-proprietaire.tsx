import { Head, Link } from '@inertiajs/react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type Kpi = {
    reservations_mois: number;
    total_encaisse: number;
    appartements_en_maintenance: number;
    equipements_en_panne: number;
};

function formatFcfa(n: number): string {
    return n.toLocaleString('fr-FR');
}

export default function DashboardProprietaire({ kpi }: { kpi: Kpi }) {
    return (
        <>
            <Head title="Tableau de bord" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h1 className="text-2xl font-semibold">Mon patrimoine</h1>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">Réservations ce mois-ci</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{kpi.reservations_mois}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">Total encaissé ce mois-ci</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{formatFcfa(kpi.total_encaisse)} <span className="text-base font-normal text-muted-foreground">FCFA</span></div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">Appartements en maintenance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{kpi.appartements_en_maintenance}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">Équipements en panne</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{kpi.equipements_en_panne}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Accès rapides</CardTitle>
                        <CardDescription>Vues scopées à votre patrimoine uniquement.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3 text-sm">
                        <Link href="/admin/planning" className="text-primary hover:underline">Planning des réservations</Link>
                        <Link href="/admin/encaissements" className="text-primary hover:underline">Paiements encaissés</Link>
                        <Link href="/admin/equipements-statut" className="text-primary hover:underline">État des équipements</Link>
                        <Link href="/admin/partenaires-catalogue" className="text-primary hover:underline">Partenaires</Link>
                        <Link href="/admin/appartements" className="text-primary hover:underline">Mes appartements</Link>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
