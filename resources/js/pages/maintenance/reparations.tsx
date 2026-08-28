import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import MaintenanceController from '@/actions/App/Http/Controllers/MaintenanceController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InterventionDialog } from './intervention-dialog';
import {
    ETAPE_LABELS,
    PrioriteBadge,
    SlaBadge,
    fmtDateHeure,
    fmtDuree,
    fmtMontant,
    nomComplet,
} from './shared';
import type {
    Etape,
    InterventionRow,
    ParametresMaintenance,
    Technicien,
} from './shared';

/**
 * Écran 3 du pôle — le poste de travail du technicien : uniquement ce qui est
 * réellement en atelier, présenté en trois colonnes qui suivent l'avancement. Le triage
 * (planifier, affecter) reste sur l'écran "Prise en charge" ; ici on répare, on contrôle
 * et on clôture.
 *
 * Chaque colonne porte l'étape suivante en action directe ; la fiche complète (journal
 * d'actions R4) s'ouvre au clic sur la carte.
 */
const COLONNES: {
    etape: Etape;
    suivante: Etape;
    libelleAction: string;
    description: string;
    /** L'action exige une saisie : le bouton ouvre la fiche au lieu d'avancer l'étape. */
    viaFiche?: boolean;
}[] = [
    {
        etape: 'en_cours',
        suivante: 'reparee',
        libelleAction: 'Marquer réparée',
        description: 'Réparation engagée, journal en cours de saisie.',
    },
    {
        etape: 'reparee',
        suivante: 'controlee',
        libelleAction: 'Tester la conformité',
        description: 'Réparé, en attente du contrôle.',
        // R5 : on ne passe pas « contrôlé » d'un clic, on enregistre un résultat de test
        // — le serveur refuse d'ailleurs cette transition sur la route générique.
        viaFiche: true,
    },
    {
        etape: 'controlee',
        suivante: 'cloturee',
        libelleAction: 'Clôturer',
        description: 'Contrôlé, prêt à être restitué au parc.',
    },
];

export default function MaintenanceReparations({
    interventions,
    techniciens,
    parametres,
}: {
    interventions: InterventionRow[];
    techniciens: Technicien[];
    parametres: ParametresMaintenance;
}) {
    const [detailId, setDetailId] = useState<number | null>(null);

    // Relu dans la liste fraîche à chaque rendu : une intervention qui change d'étape
    // change aussi de colonne, la fiche ouverte doit suivre.
    const detail = interventions.find((i) => i.id === detailId) ?? null;

    function avancer(intervention: InterventionRow, etape: Etape) {
        router.patch(
            MaintenanceController.changerEtape(intervention.id).url,
            { etape },
            { preserveScroll: true },
        );
    }

    return (
        <>
            <Head title="Réparations" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Réparations</h1>
                    <p className="text-sm text-muted-foreground">
                        Les dossiers en atelier, de la réparation engagée
                        jusqu'à la clôture.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {COLONNES.map((colonne) => {
                        const lignes = interventions.filter(
                            (i) => i.etape === colonne.etape,
                        );

                        return (
                            <div
                                key={colonne.etape}
                                className="flex flex-col gap-3 rounded-xl border p-3"
                            >
                                <div>
                                    <div className="flex items-center justify-between">
                                        <h2 className="font-medium">
                                            {ETAPE_LABELS[colonne.etape]}
                                        </h2>
                                        <Badge variant="secondary">
                                            {lignes.length}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {colonne.description}
                                    </p>
                                </div>

                                {lignes.length === 0 ? (
                                    <p className="py-6 text-center text-xs text-muted-foreground">
                                        Rien à cette étape.
                                    </p>
                                ) : (
                                    lignes.map((intervention) => {
                                        const tempsTotal = (
                                            intervention.actions ?? []
                                        ).reduce(
                                            (total, action) =>
                                                total +
                                                (action.temps_passe_minutes ??
                                                    0),
                                            0,
                                        );

                                        return (
                                            <div
                                                key={intervention.id}
                                                className="space-y-2 rounded-md border p-3 text-sm"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setDetailId(
                                                            intervention.id,
                                                        )
                                                    }
                                                    className="w-full space-y-1 text-left"
                                                >
                                                    <p className="font-medium">
                                                        {intervention.equipement
                                                            ?.nom ??
                                                            'Équipement supprimé'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {intervention.appartement
                                                            ? `Appartement ${intervention.appartement.numero}`
                                                            : 'Hors appartement'}{' '}
                                                        ·{' '}
                                                        {nomComplet(
                                                            intervention.technicien,
                                                        )}
                                                    </p>
                                                    <p className="line-clamp-2 text-xs">
                                                        {
                                                            intervention.description_panne
                                                        }
                                                    </p>
                                                </button>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    <PrioriteBadge
                                                        priorite={
                                                            intervention.priorite
                                                        }
                                                    />
                                                    <SlaBadge
                                                        intervention={
                                                            intervention
                                                        }
                                                    />
                                                    {intervention.sous_garantie && (
                                                        <Badge variant="secondary">
                                                            Sous garantie
                                                        </Badge>
                                                    )}
                                                </div>

                                                <p className="text-xs text-muted-foreground">
                                                    Signalée le{' '}
                                                    {fmtDateHeure(
                                                        intervention.date_signalement,
                                                    )}{' '}
                                                    · {fmtDuree(tempsTotal)} ·{' '}
                                                    {fmtMontant(
                                                        intervention.cout_total,
                                                    )}
                                                </p>

                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        className="flex-1"
                                                        title={
                                                            colonne.suivante ===
                                                            'cloturee'
                                                                ? (intervention.blocage_cloture ??
                                                                  undefined)
                                                                : undefined
                                                        }
                                                        disabled={
                                                            colonne.viaFiche
                                                                ? false
                                                                : !intervention.transitions.includes(
                                                                      colonne.suivante,
                                                                  ) ||
                                                                  (colonne.suivante ===
                                                                      'cloturee' &&
                                                                      intervention.blocage_cloture !==
                                                                          null)
                                                        }
                                                        onClick={() =>
                                                            colonne.viaFiche
                                                                ? setDetailId(
                                                                      intervention.id,
                                                                  )
                                                                : avancer(
                                                                      intervention,
                                                                      colonne.suivante,
                                                                  )
                                                        }
                                                    >
                                                        {colonne.libelleAction}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            setDetailId(
                                                                intervention.id,
                                                            )
                                                        }
                                                    >
                                                        Journal
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <InterventionDialog
                intervention={detail}
                techniciens={techniciens}
                parametres={parametres}
                onClose={() => setDetailId(null)}
            />
        </>
    );
}

MaintenanceReparations.layout = {
    breadcrumbs: [
        { title: 'Maintenance', href: MaintenanceController.dashboard() },
        { title: 'Réparations', href: MaintenanceController.reparations() },
    ],
};
