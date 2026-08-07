import { useState } from 'react';
import { Download } from 'lucide-react';
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

export function ExportDialog({ exportUrl }: { exportUrl: string }) {
    const [open, setOpen] = useState(false);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    function download() {
        const params = new URLSearchParams();
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        window.location.href = params.size ? `${exportUrl}?${params.toString()}` : exportUrl;
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Download /> Exporter
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Exporter en CSV</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="export-from">Du</Label>
                        <Input id="export-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="export-to">Au</Label>
                        <Input id="export-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">
                    Laisser vide pour exporter toutes les lignes, sans filtre de date.
                </p>
                <DialogFooter>
                    <Button onClick={download}>Télécharger</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
