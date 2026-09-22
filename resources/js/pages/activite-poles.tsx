import { Head, Link } from '@inertiajs/react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type Kpi = {
    label: string;
    value: number;
    unite?: string;
};

type Pole = {
    slug: string;
    label: string;
    kpis: Kpi[];
};

type EntrepriseConsultee = {
    id: number;
    nom: string;
};

// N'a de sens que côté Propriétaire/Gérant (voir `entreprise` ci-dessous) : l'administrateur
// n'a pas le rôle requis pour ces pages et les ouvrir lui renverrait un 403.
const LIENS_DETAIL: Record<string, string> = {
    reception: '/admin/receptionniste',
    maintenance: '/admin/maintenance',
    comptabilite: '/admin/comptabilite',
    rh: '/admin/rh',
    logistique: '/admin/logistique',
};

function formatValeur(kpi: Kpi): string {
    return kpi.unite ? `${kpi.value.toLocaleString('fr-FR')} ${kpi.unite}` : kpi.value.toLocaleString('fr-FR');
}

export default function ActivitePoles({ poles, entreprise }: { poles: Pole[]; entreprise?: EntrepriseConsultee }) {
    return (
        <>
            <Head title="Activité des pôles" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Activité des pôles</h1>
                    {entreprise && (
                        <p className="text-sm text-muted-foreground">Vous consultez : {entreprise.nom}</p>
                    )}
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {poles.map((pole) => (
                        <Card key={pole.slug}>
                            <CardHeader>
                                <CardTitle>{pole.label}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2">
                                {pole.kpis.map((kpi) => (
                                    <div key={kpi.label} className="flex items-baseline justify-between gap-4 text-sm">
                                        <span className="text-muted-foreground">{kpi.label}</span>
                                        <span className="font-semibold">{formatValeur(kpi)}</span>
                                    </div>
                                ))}
                                {!entreprise && LIENS_DETAIL[pole.slug] && (
                                    <Link href={LIENS_DETAIL[pole.slug]} className="mt-2 text-sm text-primary hover:underline">
                                        Voir le détail
                                    </Link>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </>
    );
}
