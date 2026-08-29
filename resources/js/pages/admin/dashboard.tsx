import { Head, Link } from '@inertiajs/react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type StatutEntreprise = 'active' | 'essai' | 'suspendue';

type Kpi = {
    entreprises_actives: number;
    entreprises_essai: number;
    entreprises_suspendues: number;
    total_utilisateurs: number;
    reservations_mois: number;
    ca_mois: number;
};

type EntrepriseRow = {
    id: number;
    nom: string;
    statut: StatutEntreprise;
    users_count: number;
    appartements_count: number;
    employes_count: number;
};

const STATUT_LABELS: Record<StatutEntreprise, string> = {
    active: 'Active',
    essai: 'Essai',
    suspendue: 'Suspendue',
};

const STATUT_VARIANTS: Record<StatutEntreprise, 'default' | 'secondary' | 'destructive'> = {
    active: 'default',
    essai: 'secondary',
    suspendue: 'destructive',
};

function formatFcfa(n: number): string {
    return n.toLocaleString('fr-FR');
}

export default function AdminDashboard({ kpi, entreprises }: { kpi: Kpi; entreprises: EntrepriseRow[] }) {
    return (
        <>
            <Head title="Tableau de bord" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h1 className="text-2xl font-semibold">Vue plateforme</h1>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">Entreprises</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-baseline gap-3">
                            <div className="text-4xl font-bold">{kpi.entreprises_actives}</div>
                            <div className="text-xs text-muted-foreground">
                                active{kpi.entreprises_actives > 1 ? 's' : ''}
                                <br />
                                {kpi.entreprises_essai} essai · {kpi.entreprises_suspendues} suspendue{kpi.entreprises_suspendues > 1 ? 's' : ''}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">Utilisateurs (toutes entreprises)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{kpi.total_utilisateurs}</div>
                        </CardContent>
                    </Card>
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
                            <CardTitle className="text-sm text-muted-foreground">CA encaissé ce mois-ci</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{formatFcfa(kpi.ca_mois)} <span className="text-base font-normal text-muted-foreground">FCFA</span></div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Entreprises</CardTitle>
                        <CardDescription>Vue d'ensemble — cliquer pour gérer les utilisateurs d'une entreprise.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="py-2 pr-4 font-medium">Nom</th>
                                        <th className="py-2 pr-4 font-medium">Statut</th>
                                        <th className="py-2 pr-4 font-medium">Utilisateurs</th>
                                        <th className="py-2 pr-4 font-medium">Appartements</th>
                                        <th className="py-2 pr-4 font-medium">Employés</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entreprises.map((e) => (
                                        <tr key={e.id} className="border-b last:border-0">
                                            <td className="py-2 pr-4">
                                                <Link href={`/admin/entreprises/${e.id}/utilisateurs`} className="text-primary hover:underline">
                                                    {e.nom}
                                                </Link>
                                            </td>
                                            <td className="py-2 pr-4">
                                                <Badge variant={STATUT_VARIANTS[e.statut]}>{STATUT_LABELS[e.statut]}</Badge>
                                            </td>
                                            <td className="py-2 pr-4">{e.users_count}</td>
                                            <td className="py-2 pr-4">{e.appartements_count}</td>
                                            <td className="py-2 pr-4">{e.employes_count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
