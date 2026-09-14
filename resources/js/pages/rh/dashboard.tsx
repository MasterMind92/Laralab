import { Head, Link } from '@inertiajs/react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type Kpi = {
    recrutements_ouverts: number;
    candidats_en_pipeline: number;
    conges_en_attente: number;
    contrats_bientot_echus: number;
    employes_actifs: number;
};

export default function RhDashboard({ kpi }: { kpi: Kpi }) {
    return (
        <>
            <Head title="Ressources humaines" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h1 className="text-2xl font-semibold">Ressources humaines</h1>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">Employés actifs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{kpi.employes_actifs}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">Recrutements ouverts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{kpi.recrutements_ouverts}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">Candidats en pipeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{kpi.candidats_en_pipeline}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">Congés en attente</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{kpi.conges_en_attente}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">Contrats bientôt échus</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{kpi.contrats_bientot_echus}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Accès rapides</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3 text-sm">
                        <Link href="/admin/employes" className="text-primary hover:underline">Employés</Link>
                        <Link href="/admin/recrutements" className="text-primary hover:underline">Recrutements</Link>
                        <Link href="/admin/contrats" className="text-primary hover:underline">Contrats</Link>
                        <Link href="/admin/conges" className="text-primary hover:underline">Congés</Link>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
