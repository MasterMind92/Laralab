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
import type { Etape, InterventionRow, Technicien, TypeAction } from './shared';

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
 * Étapes atteignables par un simple bouton. Les trois autres transitions légales sont
 * volontairement absentes : 'planifiee' et 'technicien_affecte' passent par leur propre
 * formulaire (une date, un technicien), et 'reformee' exige un motif et une répercussion
 * sur l'équipement — c'est la règle R6, livrée en étape C.
 */
const LIBELLES_TRANSITION: Partial<Record<Etape, string>> = {
    en_cours: 'Démarrer la réparation',
    reparee: 'Marquer réparée',
    controlee: 'Marquer contrôlée',
    cloturee: 'Clôturer',
};

export function InterventionDialog({
    intervention,
    techniciens,
    onClose,
}: {
    intervention: InterventionRow | null;
    techniciens: Technicien[];
    onClose: () => void;
}) {
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
