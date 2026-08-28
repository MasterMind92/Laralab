import { Badge } from '@/components/ui/badge';

/**
 * Vocabulaire commun aux 4 écrans du pôle Maintenance (Phase 05). `etape` est la seule
 * valeur persistée côté serveur ; `statut_macro` en est la vue simplifiée (R9), calculée
 * en PHP par Intervention::statutMacro() et transmise telle quelle — ne jamais la
 * recalculer ici, les deux divergeraient au premier changement de règle.
 */
export type Etape =
    | 'signalee'
    | 'planifiee'
    | 'technicien_affecte'
    | 'en_cours'
    | 'reparee'
    | 'controlee'
    | 'cloturee'
    | 'reformee';

export type StatutMacro =
    | 'declaree'
    | 'en_cours'
    | 'reparee'
    | 'restituee'
    | 'reformee';

export type Priorite = 'basse' | 'normale' | 'haute' | 'critique';

export type TypeAction =
    | 'diagnostic'
    | 'reparation'
    | 'piece'
    | 'controle'
    | 'note';

export type ActionJournal = {
    id: number;
    type: TypeAction;
    description: string | null;
    temps_passe_minutes: number | null;
    piece_libelle: string | null;
    piece_quantite: number | null;
    cout: number;
    effectuee_le: string | null;
};

export type Conformite = 'conforme' | 'non_conforme';

/** Réglages de l'entreprise, servis par MaintenanceController::parametresPourEcran(). */
export type ParametresMaintenance = {
    seuil_reforme: number;
    sla_heures: Record<Priorite, number>;
};

export type Personne = { id: number; nom: string; prenom: string };

export type Technicien = Personne & { poste: string | null };

export type InterventionRow = {
    id: number;
    description_panne: string;
    priorite: Priorite;
    etape: Etape;
    statut_macro: StatutMacro;
    date_signalement: string | null;
    date_planifiee: string | null;
    date_prise_en_charge: string | null;
    sla_echeance: string | null;
    date_resolution: string | null;
    sla_depasse: boolean;
    sous_garantie: boolean;
    cout_total: number;
    conformite_resultat: Conformite | null;
    conformite_testee_le: string | null;
    motif_reforme: string | null;
    cout_reparation_estime: number | null;
    /**
     * Raison pour laquelle la clôture est refusée, ou null si elle est possible (R5).
     * Calculée par Intervention::blocageCloture() — on affiche le message du serveur,
     * on ne rejoue jamais la règle ici.
     */
    blocage_cloture: string | null;
    /** Transitions autorisées depuis l'étape courante — source: Intervention::TRANSITIONS. */
    transitions: Etape[];
    equipement: { id: number; nom: string; type: string } | null;
    appartement: { id: number; numero: string } | null;
    declarant: Personne | null;
    technicien: Personne | null;
    actions?: ActionJournal[];
};

export const ETAPE_LABELS: Record<Etape, string> = {
    signalee: 'Signalée',
    planifiee: 'Planifiée',
    technicien_affecte: 'Technicien affecté',
    en_cours: 'En cours',
    reparee: 'Réparée',
    controlee: 'Contrôlée',
    cloturee: 'Clôturée',
    reformee: 'Réformée',
};

export const MACRO_LABELS: Record<StatutMacro, string> = {
    declaree: 'Déclarée',
    en_cours: 'En cours',
    reparee: 'Réparée',
    restituee: 'Restituée',
    reformee: 'Réformée',
};

export const PRIORITE_LABELS: Record<Priorite, string> = {
    basse: 'Basse',
    normale: 'Normale',
    haute: 'Haute',
    critique: 'Critique',
};

export const TYPE_ACTION_LABELS: Record<TypeAction, string> = {
    diagnostic: 'Diagnostic',
    reparation: 'Réparation',
    piece: 'Pièce posée',
    controle: 'Contrôle',
    note: 'Note',
};

/** Ordre d'affichage stable, aligné sur Intervention::ETAPES. */
export const ETAPES: Etape[] = [
    'signalee',
    'planifiee',
    'technicien_affecte',
    'en_cours',
    'reparee',
    'controlee',
    'cloturee',
    'reformee',
];

export const PRIORITES: Priorite[] = ['critique', 'haute', 'normale', 'basse'];

const ETAPE_VARIANTS: Record<
    Etape,
    'default' | 'secondary' | 'destructive' | 'outline'
> = {
    signalee: 'destructive',
    planifiee: 'secondary',
    technicien_affecte: 'secondary',
    en_cours: 'default',
    reparee: 'default',
    controlee: 'default',
    cloturee: 'outline',
    reformee: 'outline',
};

const PRIORITE_VARIANTS: Record<
    Priorite,
    'default' | 'secondary' | 'destructive' | 'outline'
> = {
    critique: 'destructive',
    haute: 'destructive',
    normale: 'secondary',
    basse: 'outline',
};

export function EtapeBadge({ etape }: { etape: Etape }) {
    return <Badge variant={ETAPE_VARIANTS[etape]}>{ETAPE_LABELS[etape]}</Badge>;
}

export function PrioriteBadge({ priorite }: { priorite: Priorite }) {
    return (
        <Badge
            variant={PRIORITE_VARIANTS[priorite]}
            className={priorite === 'haute' ? 'opacity-80' : undefined}
        >
            {PRIORITE_LABELS[priorite]}
        </Badge>
    );
}

/**
 * Le verdict de dépassement vient du serveur (Intervention::slaDepasse) : le navigateur
 * ne rejoue pas la règle des heures ouvrées, il l'affiche.
 */
export function SlaBadge({ intervention }: { intervention: InterventionRow }) {
    if (!intervention.sla_echeance) {
        return <span className="text-xs text-muted-foreground">—</span>;
    }

    if (intervention.sla_depasse) {
        return <Badge variant="destructive">Dépassé</Badge>;
    }

    return (
        <span className="text-xs text-muted-foreground">
            {intervention.date_prise_en_charge
                ? 'Tenu'
                : `Avant ${fmtDateHeure(intervention.sla_echeance)}`}
        </span>
    );
}

export function ConformiteBadge({ resultat }: { resultat: Conformite | null }) {
    if (resultat === null) {
        return <Badge variant="outline">Non testée</Badge>;
    }

    return (
        <Badge variant={resultat === 'conforme' ? 'default' : 'destructive'}>
            {resultat === 'conforme' ? 'Conforme' : 'Non conforme'}
        </Badge>
    );
}

export function nomComplet(personne: Personne | null | undefined): string {
    return personne ? `${personne.prenom} ${personne.nom}` : '—';
}

export function fmtDateHeure(valeur: string | null | undefined): string {
    if (!valeur) {
        return '—';
    }

    return new Date(valeur).toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function fmtDate(valeur: string | null | undefined): string {
    if (!valeur) {
        return '—';
    }

    return new Date(valeur).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export function fmtDuree(minutes: number | null | undefined): string {
    if (!minutes) {
        return '—';
    }

    const heures = Math.floor(minutes / 60);

    return heures > 0
        ? `${heures} h ${String(minutes % 60).padStart(2, '0')}`
        : `${minutes} min`;
}

export function fmtMontant(montant: number): string {
    return `${Number(montant).toLocaleString('fr-FR')} FCFA`;
}
