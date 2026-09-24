import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, BedDouble, ConciergeBell, DoorOpen, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
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

type StatutReservation = 'en_attente' | 'validee' | 'annulee' | 'terminee';

const STATUT_LABELS: Record<StatutReservation, string> = {
    en_attente: 'En attente',
    validee: 'Validée',
    annulee: 'Annulée',
    terminee: 'Terminée',
};

type DemandeRow = {
    id: number;
    designation: string;
    quantite: number;
    appartement: { numero: string } | null;
    client: { nom: string; prenom: string } | null;
};

function nomComplet(personne: { nom: string; prenom: string } | null): string {
    return personne ? `${personne.prenom} ${personne.nom}` : 'Client supprimé';
}

export default function ReceptionnisteDashboard({
    kpi,
    parStatutReservation,
    demandesEnAttente,
}: {
    kpi: Kpi;
    parStatutReservation: { statut: StatutReservation; total: number }[];
    demandesEnAttente: DemandeRow[];
}) {
    const totalReservations = parStatutReservation.reduce((total, ligne) => total + ligne.total, 0);

    return (
        <>
            <Head title="Réception" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h1 className="text-2xl font-semibold">Réception</h1>

                <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
                    <KpiCard titre="Réservations en attente" valeur={kpi.reservations_en_attente} description="À confirmer ou annuler" icone={<BedDouble className="h-4 w-4" />} alerte={kpi.reservations_en_attente > 0} />
                    <KpiCard titre="Séjours en cours" valeur={kpi.sejours_en_cours} description="Client présent" icone={<DoorOpen className="h-4 w-4" />} />
                    <KpiCard titre="Demandes de service" valeur={kpi.demandes_service_en_attente} description="Pas encore livrées" icone={<ConciergeBell className="h-4 w-4" />} />
                    <KpiCard titre="Dommages non facturés" valeur={kpi.dommages_non_factures} description="À reporter sur la facture" icone={<AlertTriangle className="h-4 w-4" />} />
                    <KpiCard titre="Pannes signalées" valeur={kpi.pannes_signalees} description="Pas encore prises en charge" icone={<Wrench className="h-4 w-4" />} />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Réservations par statut</CardTitle>
                        <CardDescription>De la demande à la clôture du séjour.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {parStatutReservation.map((ligne) => (
                            <div key={ligne.statut} className="flex items-center gap-3 text-sm">
                                <span className="w-28 shrink-0">{STATUT_LABELS[ligne.statut]}</span>
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full bg-primary"
                                        style={{ width: totalReservations ? `${(ligne.total / totalReservations) * 100}%` : '0%' }}
                                    />
                                </div>
                                <span className="w-8 text-right tabular-nums">{ligne.total}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Demandes à traiter en priorité</CardTitle>
                        <CardDescription>En attente de livraison, les plus anciennes d'abord.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {demandesEnAttente.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Aucune demande en attente.</p>
                        ) : (
                            <div className="space-y-2">
                                {demandesEnAttente.map((demande) => (
                                    <div key={demande.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
                                        <div className="space-y-1">
                                            <p className="font-medium">
                                                {demande.designation} × {demande.quantite}
                                                {demande.appartement ? ` — appartement ${demande.appartement.numero}` : ''}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{nomComplet(demande.client)}</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-2">
                                    <Button asChild variant="outline" size="sm">
                                        <Link href="/admin/demandes-service">Voir toutes les demandes</Link>
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
                <div className={`text-2xl font-bold ${alerte ? 'text-destructive' : ''}`}>{valeur}</div>
                <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
}
