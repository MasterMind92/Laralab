import { Head, useForm } from '@inertiajs/react';
import { type FormEvent, useState } from 'react';
import InterventionController from '@/actions/App/Http/Controllers/InterventionController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExportDialog } from '@/components/data-table/export-dialog';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type StatutEquipement = 'stock' | 'affecte' | 'en_panne';

type InterventionResume = {
    id: number;
    description_panne: string;
    date_signalement: string;
    date_resolution: string | null;
    statut: 'signalee' | 'en_cours' | 'resolue';
};

type EquipementResume = {
    id: number;
    nom: string;
    type: string;
    statut: StatutEquipement;
    appartement: { id: number; numero: string } | null;
    interventions: InterventionResume[];
};

const STATUT_LABELS: Record<StatutEquipement, string> = {
    stock: 'En stock',
    affecte: 'Affecté',
    en_panne: 'En panne',
};

const STATUT_VARIANTS: Record<StatutEquipement, 'default' | 'secondary' | 'destructive'> = {
    stock: 'secondary',
    affecte: 'default',
    en_panne: 'destructive',
};

function fmt(d: string): string {
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function EquipementsSuivi({ equipements }: { equipements: EquipementResume[] }) {
    const [details, setDetails] = useState<EquipementResume | null>(null);
    const [signalement, setSignalement] = useState<EquipementResume | null>(null);

    const form = useForm({ equipement_id: '', description_panne: '' });
    const { data, setData, errors, processing } = form;

    function openSignalement(equipement: EquipementResume) {
        form.reset();
        form.setData('equipement_id', String(equipement.id));
        setSignalement(equipement);
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        form.post(InterventionController.store().url, {
            preserveScroll: true,
            onSuccess: () => setSignalement(null),
        });
    }

    return (
        <>
            <Head title="Suivi des équipements" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Suivi des équipements</h1>
                    <ExportDialog exportUrl={InterventionController.export().url} />
                </div>

                <div className="overflow-hidden rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Appartement</TableHead>
                                <TableHead>Équipement</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="w-48" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {equipements.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        Aucun équipement affecté à un appartement pour le moment.
                                    </TableCell>
                                </TableRow>
                            )}
                            {equipements.map((equipement) => (
                                <TableRow key={equipement.id}>
                                    <TableCell className="font-medium">{equipement.appartement?.numero ?? '—'}</TableCell>
                                    <TableCell>{equipement.nom}</TableCell>
                                    <TableCell>{equipement.type}</TableCell>
                                    <TableCell>
                                        <Badge variant={STATUT_VARIANTS[equipement.statut]}>{STATUT_LABELS[equipement.statut]}</Badge>
                                    </TableCell>
                                    <TableCell className="flex justify-end gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setDetails(equipement)}>
                                            Détails
                                        </Button>
                                        <Button size="sm" onClick={() => openSignalement(equipement)}>
                                            Signaler une panne
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={details !== null} onOpenChange={(open) => !open && setDetails(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{details?.nom}</DialogTitle>
                    </DialogHeader>
                    {details && (
                        <div className="space-y-3 text-sm">
                            <p>
                                <span className="text-muted-foreground">Appartement : </span>
                                {details.appartement?.numero ?? '—'}
                            </p>
                            <p>
                                <span className="text-muted-foreground">Type : </span>
                                {details.type}
                            </p>
                            <p>
                                <span className="text-muted-foreground">Statut : </span>
                                {STATUT_LABELS[details.statut]}
                            </p>
                            <div>
                                <p className="text-muted-foreground mb-2">Historique des interventions</p>
                                {details.interventions.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">Aucune intervention signalée.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {details.interventions.map((intervention) => (
                                            <div key={intervention.id} className="rounded-md border p-2 text-xs">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium">{fmt(intervention.date_signalement)}</span>
                                                    <Badge variant={intervention.statut === 'resolue' ? 'default' : 'secondary'}>
                                                        {intervention.statut}
                                                    </Badge>
                                                </div>
                                                <p>{intervention.description_panne}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={signalement !== null} onOpenChange={(open) => !open && setSignalement(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Signaler une panne — {signalement?.nom}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="description_panne">Description de la panne</Label>
                            <textarea
                                id="description_panne"
                                rows={4}
                                className="border-input flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none"
                                value={data.description_panne}
                                onChange={(e) => setData('description_panne', e.target.value)}
                            />
                            {errors.description_panne && <p className="text-sm text-destructive">{errors.description_panne}</p>}
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Envoi...' : 'Signaler'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
