import { Head, Link } from '@inertiajs/react';
import { CalendarClock, ClipboardList, FileClock, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
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

type StatutRecrutement = 'brouillon' | 'en_attente_validation' | 'validee' | 'rejetee' | 'clos';

const STATUT_LABELS: Record<StatutRecrutement, string> = {
    brouillon: 'Brouillon',
    en_attente_validation: 'En attente de validation',
    validee: 'Validé',
    rejetee: 'Rejeté',
    clos: 'Clos',
};

type CongeRow = {
    id: number;
    date_debut: string | null;
    date_fin: string | null;
    employe: { nom: string; prenom: string } | null;
};

function nomComplet(personne: { nom: string; prenom: string } | null): string {
    return personne ? `${personne.prenom} ${personne.nom}` : 'Employé supprimé';
}

function fmtDate(date: string | null): string {
    return date ? new Date(date).toLocaleDateString('fr-FR') : '—';
}

export default function RhDashboard({
    kpi,
    parStatutRecrutement,
    congesEnAttente,
}: {
    kpi: Kpi;
    parStatutRecrutement: { statut: StatutRecrutement; total: number }[];
    congesEnAttente: CongeRow[];
}) {
    const totalRecrutements = parStatutRecrutement.reduce((total, ligne) => total + ligne.total, 0);

    return (
        <>
            <Head title="Ressources humaines" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h1 className="text-2xl font-semibold">Ressources humaines</h1>

                <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
                    <KpiCard titre="Employés actifs" valeur={kpi.employes_actifs} description="Sous contrat en cours" icone={<Users className="h-4 w-4" />} />
                    <KpiCard titre="Recrutements ouverts" valeur={kpi.recrutements_ouverts} description="En attente ou validés" icone={<UserPlus className="h-4 w-4" />} />
                    <KpiCard titre="Candidats en pipeline" valeur={kpi.candidats_en_pipeline} description="Dossier en cours" icone={<ClipboardList className="h-4 w-4" />} />
                    <KpiCard titre="Congés en attente" valeur={kpi.conges_en_attente} description="À valider ou refuser" icone={<CalendarClock className="h-4 w-4" />} alerte={kpi.conges_en_attente > 0} />
                    <KpiCard titre="Contrats bientôt échus" valeur={kpi.contrats_bientot_echus} description="Sous 30 jours" icone={<FileClock className="h-4 w-4" />} />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recrutements par statut</CardTitle>
                        <CardDescription>Du brouillon à la clôture.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {parStatutRecrutement.map((ligne) => (
                            <div key={ligne.statut} className="flex items-center gap-3 text-sm">
                                <span className="w-48 shrink-0">{STATUT_LABELS[ligne.statut]}</span>
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full bg-primary"
                                        style={{ width: totalRecrutements ? `${(ligne.total / totalRecrutements) * 100}%` : '0%' }}
                                    />
                                </div>
                                <span className="w-8 text-right tabular-nums">{ligne.total}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Congés à traiter en priorité</CardTitle>
                        <CardDescription>Demandes en attente, les plus anciennes d'abord.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {congesEnAttente.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Aucune demande en attente.</p>
                        ) : (
                            <div className="space-y-2">
                                {congesEnAttente.map((conge) => (
                                    <div key={conge.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
                                        <div className="space-y-1">
                                            <p className="font-medium">{nomComplet(conge.employe)}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Du {fmtDate(conge.date_debut)} au {fmtDate(conge.date_fin)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-2">
                                    <Button asChild variant="outline" size="sm">
                                        <Link href="/admin/conges">Voir toutes les demandes</Link>
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

function KpiCard({
    titre,
    valeur,
    description,
    icone,
    alerte = false,
}: {
    titre: string;
    valeur: number;
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
                <div className={`text-4xl font-bold ${alerte ? 'text-destructive' : ''}`}>{valeur}</div>
                <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
}
