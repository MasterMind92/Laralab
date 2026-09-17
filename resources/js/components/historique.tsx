import { History } from 'lucide-react';
import { useEffect, useState } from 'react';
import JournalAuditController from '@/actions/App/Http/Controllers/JournalAuditController';
import { Badge } from '@/components/ui/badge';

type Champ = { avant: unknown; apres: unknown };

type LigneHistorique = {
    id: number;
    action: 'creation' | 'modification' | 'suppression' | 'restauration';
    donnees: Record<string, Champ> | Record<string, unknown> | null;
    utilisateur: string | null;
    date: string;
};

const ACTION_LABELS: Record<LigneHistorique['action'], string> = {
    creation: 'Création',
    modification: 'Modification',
    suppression: 'Suppression',
    restauration: 'Restauration',
};

const ACTION_VARIANTS: Record<LigneHistorique['action'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
    creation: 'secondary',
    modification: 'default',
    suppression: 'destructive',
    restauration: 'outline',
};

function estDiff(donnees: LigneHistorique['donnees']): donnees is Record<string, Champ> {
    if (!donnees) {
        return false;
    }

    const premiere = Object.values(donnees)[0];

    return typeof premiere === 'object' && premiere !== null && 'avant' in (premiere as object) && 'apres' in (premiere as object);
}

function formatValeur(v: unknown): string {
    if (v === null || v === undefined || v === '') {
        return '—';
    }

    if (typeof v === 'boolean') {
        return v ? 'oui' : 'non';
    }

    return String(v);
}

/**
 * Historique d'un enregistrement (extension Phase 08) — fetch à l'ouverture, pas
 * d'eager-load côté contrôleur : un seul endpoint générique réutilisable sur n'importe
 * quelle fiche détail (voir app/Http/Controllers/JournalAuditController::pourAuditable).
 */
export function Historique({ type, id, ouvert }: { type: string; id: number; ouvert: boolean }) {
    const [lignes, setLignes] = useState<LigneHistorique[] | null>(null);

    useEffect(() => {
        if (!ouvert || lignes !== null) {
            return;
        }

        let annule = false;

        fetch(JournalAuditController.pourAuditable({ type, id }).url, {
            headers: { Accept: 'application/json' },
        })
            .then((r) => r.json())
            .then((data) => {
                if (!annule) {
                    setLignes(data.lignes ?? []);
                }
            });

        return () => {
            annule = true;
        };
    }, [ouvert, type, id, lignes]);

    if (!ouvert) {
        return null;
    }

    const chargement = lignes === null;

    return (
        <div className="grid gap-2">
            <div className="flex items-center gap-1.5 text-sm font-medium">
                <History className="h-4 w-4" /> Historique
            </div>

            {chargement && <p className="text-sm text-muted-foreground">Chargement…</p>}

            {!chargement && lignes?.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucune modification enregistrée pour l'instant.</p>
            )}

            {!chargement && lignes && lignes.length > 0 && (
                <ul className="max-h-64 divide-y overflow-y-auto rounded-md border">
                    {lignes.map((ligne) => (
                        <li key={ligne.id} className="px-3 py-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant={ACTION_VARIANTS[ligne.action]}>{ACTION_LABELS[ligne.action]}</Badge>
                                <span className="text-xs text-muted-foreground">
                                    {ligne.utilisateur ?? 'Système'} ·{' '}
                                    {new Date(ligne.date).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                                </span>
                            </div>

                            {ligne.donnees && estDiff(ligne.donnees) && (
                                <ul className="mt-1.5 space-y-0.5">
                                    {Object.entries(ligne.donnees).map(([champ, valeurs]) => (
                                        <li key={champ} className="text-xs text-muted-foreground">
                                            <span className="font-medium text-foreground">{champ}</span> : {formatValeur(valeurs.avant)}
                                            {' → '}
                                            {formatValeur(valeurs.apres)}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
