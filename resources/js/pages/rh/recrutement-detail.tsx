import { Head, router, useForm } from '@inertiajs/react';
import {
    DndContext,
    type DragEndEvent,
    PointerSensor,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { Check, Lock, Send, UserPlus, X } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import CandidatController from '@/actions/App/Http/Controllers/CandidatController';
import EntretienController from '@/actions/App/Http/Controllers/EntretienController';
import RecrutementController from '@/actions/App/Http/Controllers/RecrutementController';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

type Etape = 'recu' | 'entretien' | 'decision' | 'offre' | 'embauche';
type StatutCandidat = 'en_cours' | 'rejete' | 'offre_refusee';
type StatutRecrutement = 'brouillon' | 'en_attente_validation' | 'validee' | 'rejetee' | 'clos';

type Intervieweur = { id: number; nom: string; prenom: string };

type EntretienResume = {
    id: number;
    numero_tour: number;
    date_entretien: string;
    type: 'visio' | 'presentiel' | 'telephone';
    duree_minutes: number | null;
    statut: 'planifie' | 'realise' | 'annule';
    decision: 'favorable' | 'defavorable' | 'en_attente' | null;
    note: string | null;
    intervieweurs: Intervieweur[];
};

type CandidatResume = {
    id: number;
    nom: string;
    prenom: string;
    email: string | null;
    telephone: string | null;
    source: string | null;
    cv_path: string | null;
    lettre_motivation_path: string | null;
    etape: Etape;
    statut: StatutCandidat;
    salaire_propose: string | null;
    entretiens: EntretienResume[];
};

type Recrutement = {
    id: number;
    poste: string;
    departement: string | null;
    description: string | null;
    profil_recherche: string | null;
    competences: string[] | null;
    statut: StatutRecrutement;
    priorite: string;
    budget_min: string | null;
    budget_max: string | null;
    candidats: CandidatResume[];
};

type Employe = { id: number; nom: string; prenom: string };

const COLONNES: { id: Etape; titre: string }[] = [
    { id: 'recu', titre: 'Candidature reçue' },
    { id: 'entretien', titre: 'Entretien' },
    { id: 'decision', titre: 'Décision' },
    { id: 'offre', titre: 'Offre' },
    { id: 'embauche', titre: 'Embauche' },
];

const STATUT_LABELS: Record<StatutRecrutement, string> = {
    brouillon: 'Brouillon',
    en_attente_validation: 'En attente de validation',
    validee: 'Validée',
    rejetee: 'Rejetée',
    clos: 'Clos',
};

function formatFcfa(n: number): string {
    return n.toLocaleString('fr-FR');
}

function Colonne({ id, titre, children }: { id: Etape; titre: string; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'flex w-64 flex-none flex-col gap-2 rounded-md border bg-muted/30 p-2',
                isOver && 'ring-2 ring-primary',
            )}
        >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">{titre}</p>
            <div className="flex flex-col gap-2 min-h-16">{children}</div>
        </div>
    );
}

function CarteCandidat({ candidat, onClick }: { candidat: CandidatResume; onClick: () => void }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: String(candidat.id) });

    const style = transform
        ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 }
        : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={onClick}
            className={cn(
                'cursor-pointer rounded-md border bg-background p-2.5 text-sm shadow-sm hover:border-primary',
                isDragging && 'opacity-50',
                candidat.statut === 'rejete' && 'border-destructive/40',
                candidat.statut === 'offre_refusee' && 'border-destructive/40',
            )}
        >
            <p className="font-medium">{candidat.nom} {candidat.prenom}</p>
            <div className="mt-1 flex flex-wrap gap-1">
                {candidat.source && <Badge variant="outline" className="text-[10px]">{candidat.source}</Badge>}
                {candidat.statut === 'rejete' && <Badge variant="destructive" className="text-[10px]">Rejeté</Badge>}
                {candidat.statut === 'offre_refusee' && <Badge variant="destructive" className="text-[10px]">Offre refusée</Badge>}
            </div>
        </div>
    );
}

export default function RecrutementDetail({ recrutement, employes }: { recrutement: Recrutement; employes: Employe[] }) {
    const [selected, setSelected] = useState<CandidatResume | null>(null);
    const [addOpen, setAddOpen] = useState(false);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const addForm = useForm({ nom: '', prenom: '', email: '', telephone: '', source: 'autre' });

    function submitAdd(e: FormEvent) {
        e.preventDefault();
        addForm.post(CandidatController.store(recrutement.id).url, {
            preserveScroll: true,
            onSuccess: () => {
                addForm.reset();
                setAddOpen(false);
            },
        });
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over) return;
        const candidatId = Number(active.id);
        const nouvelleEtape = over.id as Etape;
        const candidat = recrutement.candidats.find((c) => c.id === candidatId);
        if (!candidat || candidat.etape === nouvelleEtape) return;

        router.patch(CandidatController.update(candidatId).url, { etape: nouvelleEtape }, { preserveScroll: true });
    }

    const peutModifier = recrutement.statut === 'validee';
    const aucunEnSuspens = recrutement.candidats.every(
        (c) => c.statut === 'rejete' || c.statut === 'offre_refusee' || ['offre', 'embauche'].includes(c.etape),
    );

    return (
        <>
            <Head title={`Recrutement — ${recrutement.poste}`} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-semibold">{recrutement.poste}</h1>
                            <Badge>{STATUT_LABELS[recrutement.statut]}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {recrutement.departement ?? '—'} · Priorité {recrutement.priorite}
                            {(recrutement.budget_min || recrutement.budget_max) && (
                                <> · Budget {recrutement.budget_min ? formatFcfa(Number(recrutement.budget_min)) : '?'} - {recrutement.budget_max ? formatFcfa(Number(recrutement.budget_max)) : '?'} FCFA</>
                            )}
                        </p>
                        {recrutement.competences && recrutement.competences.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {recrutement.competences.map((c) => (
                                    <Badge key={c} variant="secondary">{c}</Badge>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-none gap-2">
                        {peutModifier && (
                            <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) addForm.reset(); }}>
                                <DialogTrigger asChild>
                                    <Button variant="outline">
                                        <UserPlus /> Ajouter un candidat
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Nouveau candidat</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={submitAdd} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="a_nom">Nom</Label>
                                                <Input id="a_nom" value={addForm.data.nom} onChange={(e) => addForm.setData('nom', e.target.value)} />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="a_prenom">Prénom</Label>
                                                <Input id="a_prenom" value={addForm.data.prenom} onChange={(e) => addForm.setData('prenom', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="a_email">E-mail</Label>
                                            <Input id="a_email" type="email" value={addForm.data.email} onChange={(e) => addForm.setData('email', e.target.value)} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="a_telephone">Téléphone</Label>
                                            <Input id="a_telephone" value={addForm.data.telephone} onChange={(e) => addForm.setData('telephone', e.target.value)} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="a_source">Source</Label>
                                            <Select value={addForm.data.source} onValueChange={(v) => addForm.setData('source', v)}>
                                                <SelectTrigger id="a_source">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                                                    <SelectItem value="site_web">Site web</SelectItem>
                                                    <SelectItem value="indeed">Indeed</SelectItem>
                                                    <SelectItem value="autre">Autre</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" disabled={addForm.processing}>
                                                {addForm.processing ? 'Enregistrement...' : 'Ajouter'}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        )}
                        {recrutement.statut === 'validee' && (
                            <Button
                                disabled={!aucunEnSuspens}
                                title={!aucunEnSuspens ? "Tous les candidats doivent avoir une décision" : undefined}
                                onClick={() => router.patch(RecrutementController.cloturer(recrutement.id).url, {}, { preserveScroll: true })}
                            >
                                <Lock /> Clôturer
                            </Button>
                        )}
                    </div>
                </div>

                {!peutModifier && recrutement.statut !== 'clos' && (
                    <p className="text-sm text-muted-foreground">
                        Ce recrutement n'est pas (ou plus) validé — le tableau reste consultable mais figé.
                    </p>
                )}

                <DndContext sensors={sensors} onDragEnd={peutModifier ? handleDragEnd : undefined}>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {COLONNES.map((col) => (
                            <Colonne key={col.id} id={col.id} titre={col.titre}>
                                {recrutement.candidats
                                    .filter((c) => c.etape === col.id)
                                    .map((c) => (
                                        <CarteCandidat key={c.id} candidat={c} onClick={() => setSelected(c)} />
                                    ))}
                            </Colonne>
                        ))}
                    </div>
                </DndContext>
            </div>

            {selected && (
                <CandidatDialog
                    candidat={selected}
                    employes={employes}
                    peutModifier={peutModifier}
                    onClose={() => setSelected(null)}
                />
            )}
        </>
    );
}

function CandidatDialog({
    candidat,
    employes,
    peutModifier,
    onClose,
}: {
    candidat: CandidatResume;
    employes: Employe[];
    peutModifier: boolean;
    onClose: () => void;
}) {
    const [tourIntervieweurs, setTourIntervieweurs] = useState<number[]>([]);

    const entretienForm = useForm({
        numero_tour: String(candidat.entretiens.length + 1),
        date_entretien: '',
        type: 'visio',
        duree_minutes: '60',
    });

    const salaireForm = useForm({ salaire_propose: candidat.salaire_propose ?? '' });

    function submitEntretien(e: FormEvent) {
        e.preventDefault();
        entretienForm.post(EntretienController.store(candidat.id).url, {
            data: { ...entretienForm.data, intervieweurs: tourIntervieweurs },
            preserveScroll: true,
            onSuccess: () => {
                entretienForm.reset();
                setTourIntervieweurs([]);
            },
        } as never);
    }

    function majEntretien(entretienId: number, patch: Record<string, string>) {
        router.patch(EntretienController.update(entretienId).url, patch, { preserveScroll: true });
    }

    function rejeter() {
        router.patch(CandidatController.update(candidat.id).url, { statut: 'rejete' }, { preserveScroll: true, onSuccess: onClose });
    }

    function envoyerOffre(e: FormEvent) {
        e.preventDefault();
        salaireForm.transform((data) => ({ ...data, etape: 'offre' }));
        salaireForm.patch(CandidatController.update(candidat.id).url, { preserveScroll: true, onSuccess: onClose });
    }

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{candidat.nom} {candidat.prenom}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                        <p><span className="text-muted-foreground">E-mail : </span>{candidat.email ?? '—'}</p>
                        <p><span className="text-muted-foreground">Téléphone : </span>{candidat.telephone ?? '—'}</p>
                    </div>
                    <div className="flex gap-3">
                        {candidat.cv_path && <a href={candidat.cv_path} target="_blank" rel="noopener" className="text-primary hover:underline">CV</a>}
                        {candidat.lettre_motivation_path && <a href={candidat.lettre_motivation_path} target="_blank" rel="noopener" className="text-primary hover:underline">Lettre de motivation</a>}
                        {!candidat.cv_path && !candidat.lettre_motivation_path && <span className="text-muted-foreground">Aucune pièce jointe</span>}
                    </div>

                    {peutModifier && candidat.statut === 'en_cours' && (
                        <div className="flex gap-2 border-t pt-3">
                            <Button size="sm" variant="outline" onClick={rejeter}><X /> Rejeter</Button>
                        </div>
                    )}

                    {peutModifier && candidat.etape === 'decision' && candidat.statut === 'en_cours' && (
                        <form onSubmit={envoyerOffre} className="space-y-2 border-t pt-3">
                            <Label htmlFor="salaire_propose">Envoyer une offre — salaire proposé (FCFA)</Label>
                            <div className="flex gap-2">
                                <Input id="salaire_propose" type="number" min={0} value={salaireForm.data.salaire_propose} onChange={(e) => salaireForm.setData('salaire_propose', e.target.value)} />
                                <Button type="submit" disabled={salaireForm.processing}><Send /> Envoyer l'offre</Button>
                            </div>
                        </form>
                    )}

                    {peutModifier && candidat.etape === 'offre' && candidat.statut === 'en_cours' && (
                        <div className="flex gap-2 border-t pt-3">
                            <p className="flex-1 self-center text-muted-foreground">Réponse du candidat à l'offre :</p>
                            <Button size="sm" variant="outline" onClick={() => router.patch(CandidatController.update(candidat.id).url, { statut: 'offre_refusee' }, { preserveScroll: true, onSuccess: onClose })}>
                                <X /> Refusée
                            </Button>
                            <Button size="sm" onClick={() => router.patch(CandidatController.update(candidat.id).url, { etape: 'embauche' }, { preserveScroll: true, onSuccess: onClose })}>
                                <Check /> Acceptée
                            </Button>
                        </div>
                    )}

                    <div className="border-t pt-3">
                        <p className="mb-2 font-medium">Entretiens</p>
                        {candidat.entretiens.length === 0 && <p className="text-xs text-muted-foreground mb-2">Aucun entretien planifié.</p>}
                        <div className="space-y-2 mb-3">
                            {candidat.entretiens.map((ent) => (
                                <div key={ent.id} className="rounded-md border p-2 text-xs space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">Tour {ent.numero_tour} — {new Date(ent.date_entretien).toLocaleString('fr-FR')}</span>
                                        <Badge variant="outline">{ent.type}</Badge>
                                    </div>
                                    <p className="text-muted-foreground">
                                        {ent.intervieweurs.map((i) => `${i.nom} ${i.prenom}`).join(', ') || 'Aucun intervieweur'}
                                        {ent.duree_minutes && ` · ${ent.duree_minutes} min`}
                                    </p>
                                    {peutModifier && (
                                        <div className="flex gap-2 pt-1">
                                            <Select value={ent.statut} onValueChange={(v) => majEntretien(ent.id, { statut: v })}>
                                                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="planifie">Planifié</SelectItem>
                                                    <SelectItem value="realise">Réalisé</SelectItem>
                                                    <SelectItem value="annule">Annulé</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Select value={ent.decision ?? ''} onValueChange={(v) => majEntretien(ent.id, { decision: v })}>
                                                <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Décision" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="favorable">Favorable</SelectItem>
                                                    <SelectItem value="defavorable">Défavorable</SelectItem>
                                                    <SelectItem value="en_attente">En attente</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {peutModifier && candidat.statut === 'en_cours' && !['offre', 'embauche'].includes(candidat.etape) && (
                            <form onSubmit={submitEntretien} className="space-y-2 rounded-md border p-2">
                                <p className="text-xs font-medium">Planifier un entretien</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input type="datetime-local" value={entretienForm.data.date_entretien} onChange={(e) => entretienForm.setData('date_entretien', e.target.value)} />
                                    <Select value={entretienForm.data.type} onValueChange={(v) => entretienForm.setData('type', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="visio">Visio</SelectItem>
                                            <SelectItem value="presentiel">Présentiel</SelectItem>
                                            <SelectItem value="telephone">Téléphone</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input type="number" min={1} placeholder="Tour n°" value={entretienForm.data.numero_tour} onChange={(e) => entretienForm.setData('numero_tour', e.target.value)} />
                                    <Input type="number" min={1} placeholder="Durée (min)" value={entretienForm.data.duree_minutes} onChange={(e) => entretienForm.setData('duree_minutes', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Intervieweurs</Label>
                                    <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto">
                                        {employes.map((emp) => (
                                            <label key={emp.id} className="flex items-center gap-1.5 text-xs">
                                                <Checkbox
                                                    checked={tourIntervieweurs.includes(emp.id)}
                                                    onCheckedChange={(checked) => setTourIntervieweurs((prev) => checked ? [...prev, emp.id] : prev.filter((id) => id !== emp.id))}
                                                />
                                                {emp.nom} {emp.prenom}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <Button type="submit" size="sm" disabled={entretienForm.processing}>
                                    {entretienForm.processing ? 'Enregistrement...' : 'Planifier'}
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
