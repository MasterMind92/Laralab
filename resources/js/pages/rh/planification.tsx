import { Head, router, useForm } from '@inertiajs/react';
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ClipboardCheck,
    MoreHorizontal,
    PackagePlus,
    PlayCircle,
    Plus,
    ShieldCheck,
    Shirt,
    Sparkles,
    Trash2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import TacheController from '@/actions/App/Http/Controllers/TacheController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type TacheType = 'nettoyage' | 'linge' | 'reassort' | 'controle_general';
type TacheOrigine = 'auto_arrivee' | 'auto_depart' | 'manuelle';
type TachePriorite = 'basse' | 'normale' | 'haute';
type TacheStatut = 'a_faire' | 'en_cours' | 'terminee' | 'controlee';

type AppartementRef = { id: number; numero: string };

type TacheRow = {
    id: number;
    appartement: AppartementRef;
    reservation_id: number | null;
    type: TacheType;
    origine: TacheOrigine;
    priorite: TachePriorite;
    date_prevue: string;
    statut: TacheStatut;
    notes: string | null;
    employe_assigne: { id: number; nom: string; prenom: string } | null;
};

type EmployeOption = {
    id: number;
    nom: string;
    prenom: string;
    jours_travailles: number[] | null;
    competences: string[];
    en_conge: boolean;
};

/**
 * Vue journalière de planification des tâches d'entretien (Phase 11). Une tâche est
 * générée automatiquement à la validation d'une réservation (préparation avant
 * l'arrivée) et à la clôture d'un séjour (inspection après le départ) ; le reste — le
 * ménage/l'entretien courant hors réservation — se crée ici manuellement.
 *
 * L'assignation d'un employé reste toujours manuelle : les badges « hors planning » /
 * « en congé » / la mise en avant des employés compétents ne sont que des indications,
 * jamais un filtre qui choisit à la place du RH.
 */
const TYPE_LABELS: Record<TacheType, string> = {
    nettoyage: 'Ménage',
    linge: 'Linge',
    reassort: 'Réassort',
    controle_general: 'Contrôle général',
};

const TYPE_ICONS: Record<TacheType, LucideIcon> = {
    nettoyage: Sparkles,
    linge: Shirt,
    reassort: PackagePlus,
    controle_general: ClipboardCheck,
};

const ORIGINE_LABELS: Record<TacheOrigine, string> = {
    auto_arrivee: 'Auto — arrivée',
    auto_depart: 'Auto — départ',
    manuelle: 'Manuelle',
};

const PRIORITE_LABELS: Record<TachePriorite, string> = {
    basse: 'Basse',
    normale: 'Normale',
    haute: 'Haute',
};

const STATUT_LABELS: Record<TacheStatut, string> = {
    a_faire: 'À faire',
    en_cours: 'En cours',
    terminee: 'Terminée',
    controlee: 'Contrôlée',
};

const STATUT_VARIANTS: Record<TacheStatut, 'default' | 'secondary' | 'outline'> = {
    a_faire: 'outline',
    en_cours: 'default',
    terminee: 'secondary',
    controlee: 'secondary',
};

/** Même principe que Tache::TRANSITIONS côté serveur — la garde réelle reste le serveur. */
const TRANSITIONS: Record<TacheStatut, TacheStatut[]> = {
    a_faire: ['en_cours'],
    en_cours: ['terminee'],
    terminee: ['controlee', 'en_cours'],
    controlee: [],
};

const TRANSITION_ICONS: Record<TacheStatut, LucideIcon> = {
    a_faire: PlayCircle,
    en_cours: PlayCircle,
    terminee: CheckCircle2,
    controlee: ShieldCheck,
};

function libelleTransition(depuis: TacheStatut, vers: TacheStatut): string {
    if (vers === 'en_cours' && depuis === 'terminee') {
        return 'Renvoyer en cours (contrôle non conforme)';
    }

    return {
        a_faire: 'Remettre à faire',
        en_cours: 'Démarrer',
        terminee: 'Marquer terminée',
        controlee: 'Contrôler / clôturer',
    }[vers];
}

/** Alignés sur les libellés de base insérés par la migration create_competences_table. */
const TYPE_COMPETENCE: Record<TacheType, string> = {
    nettoyage: 'Ménage',
    linge: 'Linge',
    reassort: 'Réassort',
    controle_general: 'Contrôle général',
};

const JOURS_ABBR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function jourSemaineIso(dateIso: string): number {
    // JS : dimanche = 0 ... samedi = 6. On veut lundi = 0 ... dimanche = 6.
    return (new Date(dateIso + 'T00:00:00').getDay() + 6) % 7;
}

const VIDE = {
    appartement_id: '',
    type: 'nettoyage' as TacheType,
    priorite: 'normale' as TachePriorite,
    date_prevue: '',
    notes: '',
};

export default function Planification({
    date,
    taches,
    appartements,
    employes,
}: {
    date: string;
    taches: TacheRow[];
    appartements: AppartementRef[];
    employes: EmployeOption[];
}) {
    const [ouvert, setOuvert] = useState(false);
    const form = useForm(VIDE);

    const jour = jourSemaineIso(date);

    function changerJour(delta: number) {
        const d = new Date(date + 'T00:00:00');
        d.setDate(d.getDate() + delta);
        naviguer(d.toISOString().slice(0, 10));
    }

    function naviguer(nouvelleDate: string) {
        router.get(
            TacheController.index().url,
            { date: nouvelleDate },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    function ouvrirCreation() {
        form.reset();
        form.setData({ ...VIDE, date_prevue: date });
        setOuvert(true);
    }

    function creer(e: FormEvent) {
        e.preventDefault();
        form.post(TacheController.store().url, {
            preserveScroll: true,
            onSuccess: () => setOuvert(false),
        });
    }

    function assigner(tache: TacheRow, employeId: string) {
        router.patch(
            TacheController.assigner(tache.id).url,
            { employe_assigne_id: employeId ? Number(employeId) : null },
            { preserveScroll: true },
        );
    }

    function changerStatut(tache: TacheRow, cible: TacheStatut) {
        router.patch(
            TacheController.changerStatut(tache.id).url,
            { statut: cible },
            { preserveScroll: true },
        );
    }

    function supprimer(tache: TacheRow) {
        if (!confirm(`Supprimer cette tâche (${TYPE_LABELS[tache.type]} — ${tache.appartement.numero}) ?`)) {
            return;
        }

        router.delete(TacheController.destroy(tache.id).url, { preserveScroll: true });
    }

    const parAppartement = new Map<number, { appartement: AppartementRef; taches: TacheRow[] }>();

    for (const t of taches) {
        const entree = parAppartement.get(t.appartement.id) ?? { appartement: t.appartement, taches: [] };
        entree.taches.push(t);
        parAppartement.set(t.appartement.id, entree);
    }

    const groupes = [...parAppartement.values()].sort((a, b) => a.appartement.numero.localeCompare(b.appartement.numero));

    function employesTriesPour(type: TacheType): EmployeOption[] {
        const competenceAttendue = TYPE_COMPETENCE[type];

        return [...employes].sort((a, b) => {
            const aOk = a.competences.includes(competenceAttendue) ? 0 : 1;
            const bOk = b.competences.includes(competenceAttendue) ? 0 : 1;

            if (aOk !== bOk) {
                return aOk - bOk;
            }

            return `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`);
        });
    }

    return (
        <>
            <Head title="Planification" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h1 className="text-2xl font-semibold">Planification</h1>
                    <Dialog open={ouvert} onOpenChange={setOuvert}>
                        <DialogTrigger asChild>
                            <Button onClick={ouvrirCreation}>
                                <Plus /> Créer une tâche
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Nouvelle tâche</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={creer} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="t_appartement">Appartement</Label>
                                    <Select value={form.data.appartement_id} onValueChange={(v) => form.setData('appartement_id', v)}>
                                        <SelectTrigger id="t_appartement"><SelectValue placeholder="Choisir…" /></SelectTrigger>
                                        <SelectContent>
                                            {appartements.map((a) => (
                                                <SelectItem key={a.id} value={String(a.id)}>{a.numero}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {form.errors.appartement_id && <p className="text-sm text-destructive">{form.errors.appartement_id}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="t_type">Type</Label>
                                        <Select value={form.data.type} onValueChange={(v) => form.setData('type', v as TacheType)}>
                                            <SelectTrigger id="t_type"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {(Object.keys(TYPE_LABELS) as TacheType[]).map((t) => (
                                                    <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="t_priorite">Priorité</Label>
                                        <Select value={form.data.priorite} onValueChange={(v) => form.setData('priorite', v as TachePriorite)}>
                                            <SelectTrigger id="t_priorite"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {(Object.keys(PRIORITE_LABELS) as TachePriorite[]).map((p) => (
                                                    <SelectItem key={p} value={p}>{PRIORITE_LABELS[p]}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="t_date">Date prévue</Label>
                                    <Input id="t_date" type="date" value={form.data.date_prevue} onChange={(e) => form.setData('date_prevue', e.target.value)} />
                                    {form.errors.date_prevue && <p className="text-sm text-destructive">{form.errors.date_prevue}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="t_notes">Notes</Label>
                                    <textarea
                                        id="t_notes"
                                        rows={3}
                                        className="border-input flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none"
                                        value={form.data.notes}
                                        onChange={(e) => form.setData('notes', e.target.value)}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={form.processing}>
                                        {form.processing ? 'Enregistrement...' : 'Créer'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => changerJour(-1)}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Input type="date" value={date} onChange={(e) => naviguer(e.target.value)} className="w-auto" />
                    <Button variant="outline" size="icon" onClick={() => changerJour(1)}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        {new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                </div>

                {groupes.length === 0 && (
                    <p className="text-sm text-muted-foreground">Aucune tâche prévue ce jour-là.</p>
                )}

                <div className="space-y-4">
                    {groupes.map(({ appartement, taches: tachesAppt }) => (
                        <div key={appartement.id} className="rounded-lg border">
                            <div className="border-b bg-muted/40 px-4 py-2 text-sm font-medium">
                                Appartement {appartement.numero}
                            </div>
                            <div className="divide-y">
                                {tachesAppt.map((t) => {
                                    const TypeIcon = TYPE_ICONS[t.type];
                                    const options = TRANSITIONS[t.statut];
                                    const employesTries = employesTriesPour(t.type);
                                    const competenceAttendue = TYPE_COMPETENCE[t.type];

                                    return (
                                        <div key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                                            <div className="flex min-w-40 items-center gap-2">
                                                <TypeIcon className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm font-medium">{TYPE_LABELS[t.type]}</span>
                                            </div>

                                            <Badge variant="outline">{PRIORITE_LABELS[t.priorite]}</Badge>

                                            <Badge variant="secondary">
                                                {ORIGINE_LABELS[t.origine]}
                                                {t.reservation_id && ` (réservation #${t.reservation_id})`}
                                            </Badge>

                                            <Badge variant={STATUT_VARIANTS[t.statut]}>{STATUT_LABELS[t.statut]}</Badge>

                                            <div className="ml-auto flex items-center gap-2">
                                                <Select
                                                    value={t.employe_assigne ? String(t.employe_assigne.id) : ''}
                                                    onValueChange={(v) => assigner(t, v)}
                                                >
                                                    <SelectTrigger className="w-56">
                                                        <SelectValue placeholder="Non assignée" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {employesTries.map((e) => {
                                                            const horsPlanning = e.jours_travailles !== null && !e.jours_travailles.includes(jour);
                                                            const competent = e.competences.includes(competenceAttendue);

                                                            return (
                                                                <SelectItem key={e.id} value={String(e.id)}>
                                                                    <span className="flex items-center gap-1.5">
                                                                        {e.prenom} {e.nom}
                                                                        {competent && <Badge variant="outline" className="px-1 py-0 text-[10px]">Compétent</Badge>}
                                                                        {e.en_conge && <Badge variant="destructive" className="px-1 py-0 text-[10px]">En congé</Badge>}
                                                                        {horsPlanning && <Badge variant="outline" className="px-1 py-0 text-[10px] text-muted-foreground">Hors planning ({JOURS_ABBR[jour]})</Badge>}
                                                                    </span>
                                                                </SelectItem>
                                                            );
                                                        })}
                                                    </SelectContent>
                                                </Select>

                                                {(options.length > 0 || t.statut === 'a_faire') && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Ouvrir le menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            {options.map((cible) => {
                                                                const Icone = TRANSITION_ICONS[cible];

                                                                return (
                                                                    <DropdownMenuItem key={cible} onClick={() => changerStatut(t, cible)}>
                                                                        <Icone /> {libelleTransition(t.statut, cible)}
                                                                    </DropdownMenuItem>
                                                                );
                                                            })}
                                                            {t.statut === 'a_faire' && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem onClick={() => supprimer(t)}>
                                                                        <Trash2 className="text-red-500" />
                                                                        <span className="text-red-500">Supprimer</span>
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
