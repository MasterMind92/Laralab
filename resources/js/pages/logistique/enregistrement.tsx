import { Head, router } from '@inertiajs/react';
import { Boxes } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import LogistiqueController from '@/actions/App/Http/Controllers/LogistiqueController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fmtDate, fmtMontant } from './shared';

/**
 * Enregistrement au parc (Phase 10, étape B) — la soudure avec la Phase 05.
 *
 * Une ligne de livraison devient N équipements, UN PAR PIÈCE et non une ligne portant une
 * quantité : c'est la Maintenance qui suit ensuite chacun d'eux individuellement — numéro
 * de série, garantie, pannes, réforme. Une ligne « 3 climatiseurs » ne saurait pas dire
 * lequel est tombé en panne.
 */
type LigneAEnregistrer = {
    id: number;
    designation: string;
    quantite_recue: number;
    quantite_enregistree: number;
    reste: number;
    conforme: boolean;
    motif_ecart: string | null;
    date_reception: string | null;
    commande: string | null;
    fournisseur: string | null;
    prix_unitaire: number;
};

export default function Enregistrement({
    lignes,
}: {
    lignes: LigneAEnregistrer[];
}) {
    const [active, setActive] = useState<LigneAEnregistrer | null>(null);
    const [nom, setNom] = useState('');
    const [type, setType] = useState('');
    const [quantite, setQuantite] = useState('1');
    const [numeros, setNumeros] = useState<string[]>([]);
    const [dateAchat, setDateAchat] = useState('');
    const [garantie, setGarantie] = useState('');
    const [contrat, setContrat] = useState(false);
    const [contratRef, setContratRef] = useState('');
    const [contratEcheance, setContratEcheance] = useState('');

    function ouvrir(ligne: LigneAEnregistrer) {
        setActive(ligne);
        setNom(ligne.designation);
        setType('');
        setQuantite(String(ligne.reste));
        setNumeros(Array(ligne.reste).fill(''));
        setDateAchat(ligne.date_reception ?? '');
        setGarantie('');
        setContrat(false);
        setContratRef('');
        setContratEcheance('');
    }

    function majQuantite(valeur: string) {
        setQuantite(valeur);

        // Le nombre de champs « numéro de série » suit la quantité : en saisir trois puis
        // ramener à deux ne doit pas laisser traîner un numéro qui serait attribué à une
        // pièce inexistante.
        const n = Math.max(
            0,
            Math.min(Number(valeur) || 0, active?.reste ?? 0),
        );
        setNumeros((actuels) =>
            Array.from({ length: n }, (_, i) => actuels[i] ?? ''),
        );
    }

    function enregistrer(e: FormEvent) {
        e.preventDefault();

        if (!active) {
            return;
        }

        router.post(
            LogistiqueController.enregistrer(active.id).url,
            {
                nom,
                type,
                quantite: Number(quantite),
                numeros_serie: numeros,
                date_achat: dateAchat || null,
                garantie_fin: garantie || null,
                contrat_maintenance: contrat,
                contrat_reference: contrat ? contratRef || null : null,
                contrat_echeance: contrat ? contratEcheance || null : null,
            },
            { preserveScroll: true, onSuccess: () => setActive(null) },
        );
    }

    const aEnregistrer = lignes.reduce((s, l) => s + l.reste, 0);

    return (
        <>
            <Head title="Enregistrement au parc" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Enregistrement</h1>
                    <p className="text-sm text-muted-foreground">
                        {aEnregistrer} pièce{aEnregistrer > 1 ? 's' : ''} livrée
                        {aEnregistrer > 1 ? 's' : ''} en attente d'entrée au
                        parc
                    </p>
                </div>

                {lignes.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-md border border-dashed py-16 text-center">
                        <Boxes className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm font-medium">
                            Rien à enregistrer
                        </p>
                        <p className="max-w-sm text-sm text-muted-foreground">
                            Tout ce qui a été réceptionné est déjà entré au
                            parc.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-3 lg:grid-cols-2">
                        {lignes.map((ligne) => (
                            <section
                                key={ligne.id}
                                className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                            >
                                <div className="min-w-0 space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-medium">
                                            {ligne.designation}
                                        </p>
                                        {!ligne.conforme && (
                                            <Badge variant="destructive">
                                                Non conforme
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {ligne.commande} ·{' '}
                                        {ligne.fournisseur ??
                                            'fournisseur inconnu'}{' '}
                                        · reçu le{' '}
                                        {fmtDate(ligne.date_reception)} ·{' '}
                                        {fmtMontant(ligne.prix_unitaire)}{' '}
                                        l'unité
                                    </p>
                                    {ligne.motif_ecart && (
                                        <p className="text-xs text-red-500">
                                            Écart : {ligne.motif_ecart}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground tabular-nums">
                                        {ligne.quantite_enregistree} /{' '}
                                        {ligne.quantite_recue} déjà enregistré
                                        {ligne.quantite_enregistree > 1
                                            ? 's'
                                            : ''}
                                    </p>
                                </div>

                                <Button size="sm" onClick={() => ouvrir(ligne)}>
                                    Enregistrer {ligne.reste} pièce
                                    {ligne.reste > 1 ? 's' : ''}
                                </Button>
                            </section>
                        ))}
                    </div>
                )}
            </div>

            <Dialog
                open={active !== null}
                onOpenChange={(o) => !o && setActive(null)}
            >
                <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                    <form onSubmit={enregistrer} className="grid gap-4">
                        <DialogHeader>
                            <DialogTitle>Entrée au parc</DialogTitle>
                        </DialogHeader>

                        <p className="text-sm text-muted-foreground">
                            Chaque pièce devient un équipement distinct au
                            statut « en stock », suivi individuellement par la
                            Maintenance.
                        </p>

                        <div className="grid grid-cols-[1fr_1fr_100px] gap-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="nom">Nom de l'équipement</Label>
                                <Input
                                    id="nom"
                                    required
                                    maxLength={255}
                                    value={nom}
                                    onChange={(e) => setNom(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="type">Type</Label>
                                <Input
                                    id="type"
                                    required
                                    maxLength={255}
                                    placeholder="climatisation, mobilier…"
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="quantite">Quantité</Label>
                                <Input
                                    id="quantite"
                                    type="number"
                                    min={1}
                                    max={active?.reste ?? 1}
                                    required
                                    value={quantite}
                                    onChange={(e) =>
                                        majQuantite(e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        {numeros.length > 0 && (
                            <div className="grid gap-2">
                                <Label>Numéros de série</Label>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {numeros.map((valeur, index) => (
                                        <Input
                                            key={index}
                                            maxLength={255}
                                            placeholder={`Pièce ${index + 1} — facultatif`}
                                            value={valeur}
                                            onChange={(e) =>
                                                setNumeros((actuels) =>
                                                    actuels.map((v, i) =>
                                                        i === index
                                                            ? e.target.value
                                                            : v,
                                                    ),
                                                )
                                            }
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="date-achat">Date d'achat</Label>
                                <Input
                                    id="date-achat"
                                    type="date"
                                    value={dateAchat}
                                    onChange={(e) =>
                                        setDateAchat(e.target.value)
                                    }
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="garantie">
                                    Fin de garantie
                                </Label>
                                <Input
                                    id="garantie"
                                    type="date"
                                    value={garantie}
                                    onChange={(e) =>
                                        setGarantie(e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid gap-3 rounded-md border p-3">
                            <label className="flex items-center gap-2 text-sm font-medium">
                                <Checkbox
                                    checked={contrat}
                                    onCheckedChange={(c) =>
                                        setContrat(c === true)
                                    }
                                />
                                Sous contrat de maintenance
                            </label>

                            {contrat && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="contrat-ref">
                                            Référence du contrat
                                        </Label>
                                        <Input
                                            id="contrat-ref"
                                            maxLength={255}
                                            value={contratRef}
                                            onChange={(e) =>
                                                setContratRef(e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="contrat-echeance">
                                            Échéance
                                        </Label>
                                        <Input
                                            id="contrat-echeance"
                                            type="date"
                                            value={contratEcheance}
                                            onChange={(e) =>
                                                setContratEcheance(
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setActive(null)}
                            >
                                Annuler
                            </Button>
                            <Button type="submit">Faire entrer au parc</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

Enregistrement.layout = {
    breadcrumbs: [
        { title: 'Logistique', href: '/admin/logistique' },
        {
            title: 'Enregistrement',
            href: LogistiqueController.enregistrement(),
        },
    ],
};
