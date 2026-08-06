import { Head } from '@inertiajs/react';
import { dashboard } from '@/routes';
import Calendar from '@/components/fullcalendar/Calendar';
import type { DemandeServiceResume } from '@/components/fullcalendar/DemandesServiceSection';

type PlanningAppartement = {
    id: number;
    numero: string;
};

type PlanningClient = {
    id: number;
    nom: string;
    prenom: string;
    telephone: string | null;
    email: string | null;
};

type PlanningReservation = {
    id: number;
    date_debut: string;
    date_fin: string;
    statut: 'en_attente' | 'validee' | 'annulee' | 'terminee';
    appartement: (PlanningAppartement & { equipements: { id: number; nom: string }[] }) | null;
    client: { id: number; nom: string; prenom: string } | null;
    sejour: { id: number; statut: 'en_cours' | 'cloture'; demandes: DemandeServiceResume[] } | null;
};

export default function Dashboard({
    appartements,
    clients,
    reservations,
}: {
    appartements: PlanningAppartement[];
    clients: PlanningClient[];
    reservations: PlanningReservation[];
}) {
    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <Card>
                            <CardHeader>
                                <CardTitle>Taux Occupation</CardTitle>
                                <CardDescription></CardDescription>
                        
                            </CardHeader>
                            <CardContent>
                                <div className="text-6xl font-bold">
                                    50%
                                </div>
                            </CardContent>
                            <CardFooter>
                                <div className="text-lg flex justify-between">
                                    <div className="">
                                        Nb d'Appartements occupés :  2 sur 4
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <Card>
                            <CardHeader>
                                <CardTitle>Chiffre d'affaire Mensuel</CardTitle>
                                <CardDescription></CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className=" flex justify-between">
                                    <div className="text-6xl font-bold">
                                        1.000.000
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <div className="text-lg flex justify-between">
                                    <div className="">
                                        Augmentation de 10% 
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <Card>
                            <CardHeader>
                                <CardTitle>Alertes</CardTitle>
                                 <CardDescription>Card Description</CardDescription> 
                            </CardHeader>
                            <CardContent>
                                <div className=" flex justify-between">
                                    <div className="text-6xl font-bold">
                                        10
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <div className="text-lg flex justify-between">
                                    <div className="">
                                        5 Urgentes
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                </div> */}
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border p-5">
                    {/* <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" /> */}
                    <Calendar appartements={appartements} clients={clients} reservations={reservations} />
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
