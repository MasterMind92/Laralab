import { Head, Link } from '@inertiajs/react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type Kpi = {
    reservations_en_attente: number;
    sejours_en_cours: number;
    demandes_service_en_attente: number;
    dommages_non_factures: number;
    pannes_signalees: number;
};

export default function ReceptionnisteDashboard({ kpi }: { kpi: Kpi }) {
    return (
        <>
            <Head title="Réception" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h1 className="text-2xl font-semibold">Réception</h1>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">Réservations en attente</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{kpi.reservations_en_attente}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">Séjours en cours</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{kpi.sejours_en_cours}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">Demandes de service en attente</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{kpi.demandes_service_en_attente}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">Dommages non facturés</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{kpi.dommages_non_factures}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">Pannes signalées</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{kpi.pannes_signalees}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Accès rapides</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3 text-sm">
                        <Link href="/admin/planning" className="text-primary hover:underline">Planning</Link>
                        <Link href="/admin/reservations" className="text-primary hover:underline">Réservations</Link>
                        <Link href="/admin/sejours" className="text-primary hover:underline">Séjours</Link>
                        <Link href="/admin/demandes-service" className="text-primary hover:underline">Demandes de service</Link>
                        <Link href="/admin/equipements-suivi" className="text-primary hover:underline">Signalement des pannes</Link>
                        <Link href="/admin/devis" className="text-primary hover:underline">Devis du Séjour</Link>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
