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
};

export default function ParametresFacturationEdit({ parametres }: { parametres: Parametres }) {
    const { data, setData, errors, processing, put } = useForm({
        frais_service_actif: parametres.frais_service_actif,
        taux_frais_service: parametres.taux_frais_service,
    });

    // Le taux est stocké en fraction (0.12) mais édité en pourcentage (12) pour plus de clarté.
    const tauxPourcentage = data.taux_frais_service === '' ? '' : (Number(data.taux_frais_service) * 100).toString();

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
                        <Label htmlFor="taux_pourcentage">Taux (%)</Label>
                        <Input
                            id="taux_pourcentage"
                            type="number"
                            min={0}
                            max={100}
                            step="0.01"
                            value={tauxPourcentage}
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
