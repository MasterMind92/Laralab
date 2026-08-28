import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, ClipboardList, Timer, Wrench } from 'lucide-react';
import MaintenanceController from '@/actions/App/Http/Controllers/MaintenanceController';
import ParcEquipementController from '@/actions/App/Http/Controllers/ParcEquipementController';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    ETAPE_LABELS,
    EtapeBadge,
    PrioriteBadge,
    fmtDateHeure,
    nomComplet,
} from './shared';
import type { Etape, InterventionRow, ParametresMaintenance } from './shared';

/**
 * Tableau de bord du pôle Maintenance : une FILE DE TRAVAIL, pas du reporting. Le
 * reporting agrégé (états, tendances, coûts consolidés) est entièrement différé en
 * Phase 07 — décision actée le 2026-08-26 sur le 6e bloc "Contrôle & reporting".
 */
type Kpi = {
    a_prendre_en_charge: number;
    sla_depasses: number;
    en_reparation: number;
    ouvertes: number;
};

export default function MaintenanceDashboard({
    kpi,
    parEtape,
    urgentes,
    parametres,
}: {
    kpi: Kpi;
    parEtape: { etape: Etape; total: number }[];
    urgentes: InterventionRow[];
    parametres: ParametresMaintenance;
}) {
    const totalEtapes = parEtape.reduce(
        (total, ligne) => total + ligne.total,
        0,
    );

    return (
        <>
            <Head title="Maintenance" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h1 className="text-2xl font-semibold">Maintenance</h1>
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link href={MaintenanceController.pannes().url}>
                                Prise en charge des pannes
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link
                                href={MaintenanceController.reparations().url}
                            >
                                Réparations
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href={ParcEquipementController.index().url}>
                                Parc équipements
                            </Link>
                        </Button>
                    </div>
                </div>

                {kpi.sla_depasses > 0 && (
                    <div
                        role="alert"
                        className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3"
                    >
                        <div className="space-y-0.5">
                            <p className="text-sm font-medium text-destructive">
                                {kpi.sla_depasses} intervention
                                {kpi.sla_depasses > 1 ? 's' : ''} hors delai de
                                prise en charge
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Le delai court en heures ouvrees :{' '}
                                {parametres.sla_heures.critique} h en priorite
                                critique, {parametres.sla_heures.haute} h en
                                haute, {parametres.sla_heures.normale} h en
                                normale, {parametres.sla_heures.basse} h en
                                basse.
                            </p>
                        </div>
                        <Button asChild size="sm" variant="destructive">
                            <Link
                                href={`${MaintenanceController.interventions().url}?sla=depasse`}
                            >
                                Traiter maintenant
                            </Link>
                        </Button>
                    </div>
                )}

                <div className="grid gap-4 md:grid-cols-4">
                    <KpiCard
                        titre="À prendre en charge"
                        valeur={kpi.a_prendre_en_charge}
                        description="Pannes signalées, jamais touchées"
                        icone={<ClipboardList className="h-4 w-4" />}
                    />
                    <KpiCard
                        titre="SLA dépassés"
                        valeur={kpi.sla_depasses}
                        description="Délai de réaction non tenu"
                        icone={<Timer className="h-4 w-4" />}
                        alerte={kpi.sla_depasses > 0}
                    />
                    <KpiCard
                        titre="En réparation"
                        valeur={kpi.en_reparation}
                        description="Interventions en atelier"
                        icone={<Wrench className="h-4 w-4" />}
                    />
                    <KpiCard
                        titre="Dossiers ouverts"
                        valeur={kpi.ouvertes}
                        description="Ni clôturés ni réformés"
                        icone={<AlertTriangle className="h-4 w-4" />}
                    />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Répartition par étape</CardTitle>
                        <CardDescription>
                            Les 8 étapes du workflow interne, de la déclaration
                            à la clôture.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {parEtape.map((ligne) => (
                            <div
                                key={ligne.etape}
                                className="flex items-center gap-3 text-sm"
                            >
                                <span className="w-40 shrink-0">
                                    {ETAPE_LABELS[ligne.etape]}
                                </span>
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full bg-primary"
                                        style={{
                                            width: totalEtapes
                                                ? `${(ligne.total / totalEtapes) * 100}%`
                                                : '0%',
                                        }}
                                    />
                                </div>
                                <span className="w-8 text-right tabular-nums">
                                    {ligne.total}
                                </span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            Hors délai — à traiter en priorité
                        </CardTitle>
                        <CardDescription>
                            Dossiers ouverts dont le délai de prise en charge
                            est dépassé, les plus anciens d'abord.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {urgentes.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Aucun dépassement de SLA. Tout est sous
                                contrôle.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {urgentes.map((intervention) => (
                                    <div
                                        key={intervention.id}
                                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
                                    >
                                        <div className="space-y-1">
                                            <p className="font-medium">
                                                {intervention.equipement?.nom ??
                                                    'Équipement supprimé'}
                                                {intervention.appartement
                                                    ? ` — appartement ${intervention.appartement.numero}`
                                                    : ''}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Signalée le{' '}
                                                {fmtDateHeure(
                                                    intervention.date_signalement,
                                                )}{' '}
                                                par{' '}
                                                {nomComplet(
                                                    intervention.declarant,
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <PrioriteBadge
                                                priorite={intervention.priorite}
                                            />
                                            <EtapeBadge
                                                etape={intervention.etape}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-2">
                                    <Button asChild variant="outline" size="sm">
                                        <Link
                                            href={`${MaintenanceController.interventions().url}?sla=depasse`}
                                        >
                                            Voir tous les dépassements
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        )}
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
                <div
                    className={`text-4xl font-bold ${alerte ? 'text-destructive' : ''}`}
                >
                    {valeur}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                    {description}
                </p>
            </CardContent>
        </Card>
    );
}

MaintenanceDashboard.layout = {
    breadcrumbs: [
        { title: 'Maintenance', href: MaintenanceController.dashboard() },
    ],
};
