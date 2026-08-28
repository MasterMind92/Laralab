import { router, useForm } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import InterventionActionController from '@/actions/App/Http/Controllers/InterventionActionController';
import MaintenanceController from '@/actions/App/Http/Controllers/MaintenanceController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
    ConformiteBadge,
    EtapeBadge,
    MACRO_LABELS,
    PrioriteBadge,
    SlaBadge,
    TYPE_ACTION_LABELS,
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
    TypeAction,
} from './shared';

/**
 * Fiche complète d'une intervention : métadonnées, pilotage du workflow et journal
 * d'actions (R4). Partagée par les écrans "Suivi interventions" et "Réparations" — la
 * même fiche des deux côtés, pas deux variantes à maintenir en parallèle.
 *
 * L'appelant passe l'objet retrouvé dans SA liste à chaque rendu (et non une copie figée
 * dans un état local) : après chaque action Inertia recharge les props, et la fiche doit
 * refléter la nouvelle étape sans être refermée.
 */

/**
 * Étapes atteignables par un simple bouton. Les autres transitions légales en sont
 * volontairement absentes parce qu'elles exigent une saisie : 'planifiee' et
 * 'technicien_affecte' ont leur propre formulaire (une date, un technicien), 'controlee'
 * passe par le test de conformité (R5) et 'reformee' par la décision motivée (R6). Le
 * serveur refuse d'ailleurs ces deux dernières sur la route générique.
 */
const LIBELLES_TRANSITION: Partial<Record<Etape, string>> = {
    en_cours: 'Démarrer la réparation',
    reparee: 'Marquer réparée',
    cloturee: 'Clôturer',
};

export function InterventionDialog({
    intervention,
    techniciens,
    parametres,
    onClose,
}: {
    intervention: InterventionRow | null;
    techniciens: Technicien[];
    parametres: ParametresMaintenance;
    onClose: () => void;
}) {
    const conformite = useForm({ resultat: 'conforme', commentaire: '' });
    const reforme = useForm({ motif_reforme: '', cout_reparation_estime: '' });
    const journal = useForm({
        type: 'diagnostic' as TypeAction,
        description: '',
        temps_passe_minutes: '',
        piece_libelle: '',
        piece_quantite: '',
        cout: '',
    });

    if (!intervention) {
        return null;
    }

    function changerEtape(etape: Etape) {
        router.patch(
            MaintenanceController.changerEtape(intervention!.id).url,
            { etape },
            { preserveScroll: true },
        );
    }

    function affecter(technicienId: string) {
        router.patch(
            MaintenanceController.affecter(intervention!.id).url,
            { technicien_employe_id: technicienId },
            { preserveScroll: true },
        );
    }

    function ajouterAction(e: FormEvent) {
        e.preventDefault();
        journal.transform((data) => ({
            ...data,
            // Les champs numériques vides doivent partir en null, pas en chaîne vide :
            // la validation `integer`/`numeric` rejetterait ''.
            temps_passe_minutes: data.temps_passe_minutes || null,
            piece_quantite: data.piece_quantite || null,
            cout: data.cout || null,
            piece_libelle: data.piece_libelle || null,
            description: data.description || null,
        }));
        journal.post(InterventionActionController.store(intervention!.id).url, {
            preserveScroll: true,
            onSuccess: () => journal.reset(),
        });
    }

    function enregistrerConformite(e: FormEvent) {
        e.preventDefault();
        conformite.patch(
            MaintenanceController.testerConformite(intervention!.id).url,
            { preserveScroll: true, onSuccess: () => conformite.reset() },
        );
    }

    function enregistrerReforme(e: FormEvent) {
        e.preventDefault();
        reforme.patch(MaintenanceController.reformer(intervention!.id).url, {
            preserveScroll: true,
            onSuccess: () => reforme.reset(),
        });
    }

    function supprimerAction(actionId: number) {
        if (!confirm('Supprimer cette ligne du journal ?')) {
            return;
        }

        router.delete(InterventionActionController.destroy(actionId).url, {
            preserveScroll: true,
        });
    }

    const transitionsBouton = intervention.transitions.filter(
        (etape) => etape in LIBELLES_TRANSITION,
    );
    const fermee =
        intervention.etape === 'cloturee' || intervention.etape === 'reformee';
    const tempsTotal = (intervention.actions ?? []).reduce(
        (total, a) => total + (a.temps_passe_minutes ?? 0),
        0,
    );

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {intervention.equipement?.nom ?? 'Équipement supprimé'}
                        {intervention.appartement
                            ? ` — appartement ${intervention.appartement.numero}`
                            : ''}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <EtapeBadge etape={intervention.etape} />
                        <Badge variant="outline">
                            Macro : {MACRO_LABELS[intervention.statut_macro]}
                        </Badge>
                        <PrioriteBadge priorite={intervention.priorite} />
                        <SlaBadge intervention={intervention} />
                        {intervention.sous_garantie && (
                            <Badge variant="secondary">Sous garantie</Badge>
                        )}
                    </div>

                    <p className="text-sm">{intervention.description_panne}</p>

                    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-3">
                        <Info
                            label="Signalée le"
                            valeur={fmtDateHeure(intervention.date_signalement)}
                        />
                        <Info
                            label="Déclarée par"
                            valeur={nomComplet(intervention.declarant)}
                        />
                        <Info
                            label="Échéance SLA"
                            valeur={fmtDateHeure(intervention.sla_echeance)}
                        />
                        <Info
                            label="Prise en charge"
                            valeur={fmtDateHeure(
                                intervention.date_prise_en_charge,
                            )}
                        />
                        <Info
                            label="Planifiée"
                            valeur={fmtDateHeure(intervention.date_planifiee)}
                        />
                        <Info
                            label="Résolue le"
                            valeur={fmtDateHeure(intervention.date_resolution)}
                        />
                        <Info
                            label="Temps passé"
                            valeur={fmtDuree(tempsTotal)}
                        />
                        <Info
                            label="Coût cumulé"
                            valeur={fmtMontant(intervention.cout_total)}
                        />
                    </dl>

                    <Separator />

                    <div className="grid gap-3 md:grid-cols-2 md:items-end">
                        <div className="grid gap-1.5">
                            <Label htmlFor="technicien">Technicien</Label>
                            <Select
                                value={
                                    intervention.technicien
                                        ? String(intervention.technicien.id)
                                        : ''
                                }
                                onValueChange={affecter}
                                disabled={fermee}
                            >
                                <SelectTrigger id="technicien">
                                    <SelectValue placeholder="Aucun technicien affecté" />
                                </SelectTrigger>
                                <SelectContent>
                                    {techniciens.map((t) => (
                                        <SelectItem
                                            key={t.id}
                                            value={String(t.id)}
                                        >
                                            {t.prenom} {t.nom}
                                            {t.poste ? ` — ${t.poste}` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {transitionsBouton.map((etape) => (
                                <Button
                                    key={etape}
                                    size="sm"
                                    onClick={() => changerEtape(etape)}
                                >
                                    {LIBELLES_TRANSITION[etape]}
                                </Button>
                            ))}
                            {fermee && (
                                <p className="text-sm text-muted-foreground">
                                    Dossier fermé — plus aucune action possible.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* R5 — le test de conformité. C'est lui, et pas un bouton de
                        transition, qui fait passer une intervention réparée en contrôlée. */}
                    {intervention.etape === 'reparee' && (
                        <form
                            onSubmit={enregistrerConformite}
                            className="space-y-3 rounded-md border border-dashed p-3"
                        >
                            <div>
                                <h3 className="font-medium">
                                    Test de conformité
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Obligatoire avant clôture. Un résultat non
                                    conforme renvoie l'intervention en
                                    réparation.
                                </p>
                            </div>
                            <div className="grid gap-3 md:grid-cols-3 md:items-end">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="resultat">Résultat</Label>
                                    <Select
                                        value={conformite.data.resultat}
                                        onValueChange={(v) =>
                                            conformite.setData('resultat', v)
                                        }
                                    >
                                        <SelectTrigger id="resultat">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="conforme">
                                                Conforme
                                            </SelectItem>
                                            <SelectItem value="non_conforme">
                                                Non conforme
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5 md:col-span-2">
                                    <Label htmlFor="commentaire">
                                        Commentaire (ajouté au journal)
                                    </Label>
                                    <Input
                                        id="commentaire"
                                        value={conformite.data.commentaire}
                                        onChange={(e) =>
                                            conformite.setData(
                                                'commentaire',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </div>
                            {conformite.errors.resultat && (
                                <p className="text-sm text-destructive">
                                    {conformite.errors.resultat}
                                </p>
                            )}
                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={conformite.processing}
                                >
                                    Enregistrer le contrôle
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* Résultat du dernier contrôle, et raison d'un refus de clôture —
                        message produit par le serveur, jamais rejoué ici. */}
                    {(intervention.conformite_resultat !== null ||
                        intervention.etape === 'controlee') && (
                        <div className="space-y-2 rounded-md border p-3 text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                    Conformité
                                </span>
                                <ConformiteBadge
                                    resultat={intervention.conformite_resultat}
                                />
                                <span className="text-xs text-muted-foreground">
                                    {fmtDateHeure(
                                        intervention.conformite_testee_le,
                                    )}
                                </span>
                            </div>
                            {intervention.etape === 'controlee' &&
                                intervention.blocage_cloture && (
                                    <p className="text-xs text-destructive">
                                        {intervention.blocage_cloture}
                                    </p>
                                )}
                        </div>
                    )}

                    {/* R6 — réforme. Le seuil est affiché, jamais bloquant : la règle dit
                        « coût supérieur au seuil OU pièce indisponible ». */}
                    {intervention.etape === 'en_cours' && (
                        <form
                            onSubmit={enregistrerReforme}
                            className="space-y-3 rounded-md border border-dashed p-3"
                        >
                            <div>
                                <h3 className="font-medium">
                                    Réformer l'équipement
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Issue terminale alternative : l'équipement
                                    sort définitivement du parc. Seuil de
                                    référence de l'entreprise :{' '}
                                    {fmtMontant(parametres.seuil_reforme)}.
                                </p>
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="cout_estime">
                                    Coût de remise en état estimé (FCFA)
                                </Label>
                                <Input
                                    id="cout_estime"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={reforme.data.cout_reparation_estime}
                                    onChange={(e) =>
                                        reforme.setData(
                                            'cout_reparation_estime',
                                            e.target.value,
                                        )
                                    }
                                />
                                {Number(reforme.data.cout_reparation_estime) >
                                    parametres.seuil_reforme && (
                                    <p className="text-xs text-destructive">
                                        Au-dessus du seuil : la réforme est
                                        justifiée par le coût.
                                    </p>
                                )}
                                {reforme.errors.cout_reparation_estime && (
                                    <p className="text-sm text-destructive">
                                        {reforme.errors.cout_reparation_estime}
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="motif_reforme">Motif</Label>
                                <textarea
                                    id="motif_reforme"
                                    rows={2}
                                    placeholder="Pièce introuvable, coût supérieur à la valeur résiduelle..."
                                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none"
                                    value={reforme.data.motif_reforme}
                                    onChange={(e) =>
                                        reforme.setData(
                                            'motif_reforme',
                                            e.target.value,
                                        )
                                    }
                                />
                                {reforme.errors.motif_reforme && (
                                    <p className="text-sm text-destructive">
                                        {reforme.errors.motif_reforme}
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    size="sm"
                                    variant="destructive"
                                    disabled={reforme.processing}
                                >
                                    Réformer
                                </Button>
                            </div>
                        </form>
                    )}

                    {intervention.etape === 'reformee' && (
                        <div className="space-y-1 rounded-md border p-3 text-sm">
                            <p className="font-medium">Équipement réformé</p>
                            <p className="text-xs text-muted-foreground">
                                Coût de remise en état estimé :{' '}
                                {intervention.cout_reparation_estime === null
                                    ? '—'
                                    : fmtMontant(
                                          intervention.cout_reparation_estime,
                                      )}
                            </p>
                            <p className="text-xs">
                                {intervention.motif_reforme}
                            </p>
                        </div>
                    )}

                    <Separator />

                    <div className="space-y-3">
                        <h3 className="font-medium">Journal d'actions</h3>

                        {(intervention.actions ?? []).length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                                Aucune action enregistrée pour l'instant.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {(intervention.actions ?? []).map((action) => (
                                    <div
                                        key={action.id}
                                        className="flex items-start justify-between gap-3 rounded-md border p-2 text-xs"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary">
                                                    {
                                                        TYPE_ACTION_LABELS[
                                                            action.type
                                                        ]
                                                    }
                                                </Badge>
                                                <span className="text-muted-foreground">
                                                    {fmtDateHeure(
                                                        action.effectuee_le,
                                                    )}
                                                </span>
                                            </div>
                                            {action.description && (
                                                <p>{action.description}</p>
                                            )}
                                            {action.piece_libelle && (
                                                <p className="text-muted-foreground">
                                                    Pièce :{' '}
                                                    {action.piece_libelle}
                                                    {action.piece_quantite
                                                        ? ` × ${action.piece_quantite}`
                                                        : ''}
                                                </p>
                                            )}
                                            <p className="text-muted-foreground">
                                                {fmtDuree(
                                                    action.temps_passe_minutes,
                                                )}{' '}
                                                · {fmtMontant(action.cout)}
                                            </p>
                                        </div>
                                        {!fermee && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    supprimerAction(action.id)
                                                }
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {!fermee && (
                            <form
                                onSubmit={ajouterAction}
                                className="space-y-3 rounded-md border p-3"
                            >
                                <div className="grid gap-3 md:grid-cols-3">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="type">Type</Label>
                                        <Select
                                            value={journal.data.type}
                                            onValueChange={(v) =>
                                                journal.setData(
                                                    'type',
                                                    v as TypeAction,
                                                )
                                            }
                                        >
                                            <SelectTrigger id="type">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(
                                                    Object.keys(
                                                        TYPE_ACTION_LABELS,
                                                    ) as TypeAction[]
                                                ).map((type) => (
                                                    <SelectItem
                                                        key={type}
                                                        value={type}
                                                    >
                                                        {
                                                            TYPE_ACTION_LABELS[
                                                                type
                                                            ]
                                                        }
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="temps">
                                            Temps passé (min)
                                        </Label>
                                        <Input
                                            id="temps"
                                            type="number"
                                            min={0}
                                            value={
                                                journal.data.temps_passe_minutes
                                            }
                                            onChange={(e) =>
                                                journal.setData(
                                                    'temps_passe_minutes',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="cout">
                                            Coût (FCFA)
                                        </Label>
                                        <Input
                                            id="cout"
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={journal.data.cout}
                                            onChange={(e) =>
                                                journal.setData(
                                                    'cout',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                </div>

                                {journal.data.type === 'piece' && (
                                    <div className="grid gap-3 md:grid-cols-3">
                                        <div className="grid gap-1.5 md:col-span-2">
                                            <Label htmlFor="piece">
                                                Pièce posée
                                            </Label>
                                            <Input
                                                id="piece"
                                                placeholder="Référence ou désignation"
                                                value={
                                                    journal.data.piece_libelle
                                                }
                                                onChange={(e) =>
                                                    journal.setData(
                                                        'piece_libelle',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            {journal.errors.piece_libelle && (
                                                <p className="text-sm text-destructive">
                                                    {
                                                        journal.errors
                                                            .piece_libelle
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="quantite">
                                                Quantité
                                            </Label>
                                            <Input
                                                id="quantite"
                                                type="number"
                                                min={1}
                                                value={
                                                    journal.data.piece_quantite
                                                }
                                                onChange={(e) =>
                                                    journal.setData(
                                                        'piece_quantite',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="grid gap-1.5">
                                    <Label htmlFor="description">
                                        Description
                                    </Label>
                                    <textarea
                                        id="description"
                                        rows={2}
                                        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none"
                                        value={journal.data.description}
                                        onChange={(e) =>
                                            journal.setData(
                                                'description',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={journal.processing}
                                    >
                                        {journal.processing
                                            ? 'Enregistrement...'
                                            : 'Ajouter au journal'}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function Info({ label, valeur }: { label: string; valeur: string }) {
    return (
        <div>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd>{valeur}</dd>
        </div>
    );
}
