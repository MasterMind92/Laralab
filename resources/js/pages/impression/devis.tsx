import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import Devis, { type DevisData, defaultDevisData } from '@/components/devis/Devis';
import { Button } from '@/components/ui/button';

export default function ImpressionDevis({ devis }: { devis: DevisData }) {
    return (
        <>
            <Head title={`Devis ${devis.numeroDevis}`} />
            <div className="flex justify-center gap-2 bg-muted p-4 print:hidden">
                <Button onClick={() => window.print()}>
                    <Printer /> Imprimer / exporter en PDF
                </Button>
            </div>
            <Devis data={{ ...devis, bareme: defaultDevisData.bareme }} />
        </>
    );
}
