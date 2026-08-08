import { Head, useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';
import ParametreFacturationController from '@/actions/App/Http/Controllers/ParametreFacturationController';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Parametres = {
    frais_service_actif: boolean;
    taux_frais_service: string;
    tva_active: boolean;
    taux_tva: string;
    depot_garantie_defaut: string;
    delai_restitution_jours: number;
};

export default function ParametresFacturationEdit({ parametres }: { parametres: Parametres }) {
    const { data, setData, errors, processing, put } = useForm({
        frais_service_actif: parametres.frais_service_actif,
        taux_frais_service: parametres.taux_frais_service,
        tva_active: parametres.tva_active,
        taux_tva: parametres.taux_tva,
        depot_garantie_defaut: parametres.depot_garantie_defaut,
        delai_restitution_jours: parametres.delai_restitution_jours,
    });

    // Les taux sont stockés en fraction (0.12) mais édités en pourcentage (12) pour plus de clarté.
    const tauxServicePourcentage = data.taux_frais_service === '' ? '' : (Number(data.taux_frais_service) * 100).toString();
    const tauxTvaPourcentage = data.taux_tva === '' ? '' : (Number(data.taux_tva) * 100).toString();

    function submit(e: FormEvent) {
        e.preventDefault();
        put(ParametreFacturationController.update().url, { preserveScroll: true });
    }

    return (
        <>
            <Head title="Paramètres de facturation" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h1 className="text-2xl font-semibold">Paramètres de facturation</h1>

                <form onSubmit={submit} className="max-w-md space-y-6 rounded-md border bg-card p-6">
                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="frais_service_actif"
                            checked={data.frais_service_actif}
                            onCheckedChange={(checked) => setData('frais_service_actif', checked === true)}
                        />
                        <Label htmlFor="frais_service_actif">Facturer des frais de service au checkout</Label>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="taux_pourcentage">Taux de service (%)</Label>
                        <Input
                            id="taux_pourcentage"
                            type="number"
                            min={0}
                            max={100}
                            step="0.01"
                            value={tauxServicePourcentage}
                            onChange={(e) => setData('taux_frais_service', (Number(e.target.value) / 100).toString())}
                            disabled={!data.frais_service_actif}
                        />
                        {errors.taux_frais_service && (
                            <p className="text-sm text-destructive">{errors.taux_frais_service}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                            Appliqué au sous-total de chaque réservation lors du checkout, si activé ci-dessus.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 border-t pt-6">
                        <Checkbox
                            id="tva_active"
                            checked={data.tva_active}
                            onCheckedChange={(checked) => setData('tva_active', checked === true)}
                        />
                        <Label htmlFor="tva_active">Appliquer la TVA sur les devis/factures</Label>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="taux_tva_pourcentage">Taux de TVA (%)</Label>
                        <Input
                            id="taux_tva_pourcentage"
                            type="number"
                            min={0}
                            max={100}
                            step="0.01"
                            value={tauxTvaPourcentage}
                            onChange={(e) => setData('taux_tva', (Number(e.target.value) / 100).toString())}
                            disabled={!data.tva_active}
                        />
                        {errors.taux_tva && <p className="text-sm text-destructive">{errors.taux_tva}</p>}
                    </div>

                    <div className="grid gap-2 border-t pt-6">
                        <Label htmlFor="depot_garantie_defaut">Dépôt de garantie par défaut (FCFA)</Label>
                        <Input
                            id="depot_garantie_defaut"
                            type="number"
                            min={0}
                            step="0.01"
                            value={data.depot_garantie_defaut}
                            onChange={(e) => setData('depot_garantie_defaut', e.target.value)}
                        />
                        {errors.depot_garantie_defaut && (
                            <p className="text-sm text-destructive">{errors.depot_garantie_defaut}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                            Affiché à titre indicatif sur le devis — non prélevé sauf sinistre constaté.
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="delai_restitution_jours">Délai de restitution (jours ouvrés)</Label>
                        <Input
                            id="delai_restitution_jours"
                            type="number"
                            min={0}
                            value={data.delai_restitution_jours}
                            onChange={(e) => setData('delai_restitution_jours', Number(e.target.value))}
                        />
                        {errors.delai_restitution_jours && (
                            <p className="text-sm text-destructive">{errors.delai_restitution_jours}</p>
                        )}
                    </div>

                    <Button type="submit" disabled={processing}>
                        {processing ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                </form>
            </div>
        </>
    );
}

ParametresFacturationEdit.layout = {
    breadcrumbs: [
        {
            title: 'Paramètres de facturation',
            href: ParametreFacturationController.edit(),
        },
    ],
};
