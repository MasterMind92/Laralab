import { Badge } from '@/components/ui/badge';

/**
 * Vocabulaire commun aux cinq écrans du pôle Logistique (Phase 10).
 *
 * Les listes de transitions autorisées ne sont JAMAIS reconstruites ici : chaque ligne
 * arrive du serveur avec son champ `transitions`, dérivé de `Besoin::TRANSITIONS` ou
 * `Commande::TRANSITIONS`. L'écran affiche ce que le serveur permet ; le jour où une règle
 * change, il n'y a qu'un endroit à modifier.
 */
export type StatutBesoin =
    | 'brouillon'
    | 'soumis'
    | 'valide'
    | 'refuse'
    | 'commande';

export type StatutCommande =
    | 'brouillon'
    | 'envoyee'
    | 'confirmee'
    | 'partiellement_recue'
    | 'recue'
    | 'annulee';

export type PrioriteBesoin = 'basse' | 'normale' | 'haute';

export type StatutEquipement = 'stock' | 'affecte' | 'en_panne' | 'reforme';

export type Personne = { id: number; nom: string; prenom: string };
export type Employe = Personne & { poste: string | null };
export type AppartementRef = { id: number; numero: string };
export type FournisseurRef = {
    id: number;
    nom: string;
    contact: string | null;
};

export type BesoinRow = {
    id: number;
    designation: string;
    quantite: number;
    justification: string | null;
    priorite: PrioriteBesoin;
    statut: StatutBesoin;
    motif_refus: string | null;
    date_validation: string | null;
    created_at: string | null;
    demandeur: Personne | null;
    valideur: Personne | null;
    appartement: AppartementRef | null;
    transitions: StatutBesoin[];
};

export type CommandeRow = {
    id: number;
    reference: string | null;
    statut: StatutCommande;
    date_commande: string | null;
    date_livraison_prevue: string | null;
    notes: string | null;
    montant_total: number;
    fournisseur: { id: number; nom: string } | null;
    nb_lignes: number;
    transitions: StatutCommande[];
    accepte_reception: boolean;
};

export type LigneACommander = {
    id: number;
    designation: string;
    quantite: number;
    priorite: PrioriteBesoin;
};

export const STATUT_BESOIN_LABELS: Record<StatutBesoin, string> = {
    brouillon: 'Brouillon',
    soumis: 'Soumis',
    valide: 'Validé',
    refuse: 'Refusé',
    commande: 'Commandé',
};

export const STATUT_COMMANDE_LABELS: Record<StatutCommande, string> = {
    brouillon: 'Brouillon',
    envoyee: 'Envoyée',
    confirmee: 'Confirmée',
    partiellement_recue: 'Partiellement reçue',
    recue: 'Reçue',
    annulee: 'Annulée',
};

export const PRIORITE_LABELS: Record<PrioriteBesoin, string> = {
    basse: 'Basse',
    normale: 'Normale',
    haute: 'Haute',
};

export const STATUT_EQUIPEMENT_LABELS: Record<StatutEquipement, string> = {
    stock: 'En stock',
    affecte: 'Affecté',
    en_panne: 'En panne',
    reforme: 'Réformé',
};

export const STATUTS_BESOIN: StatutBesoin[] = [
    'brouillon',
    'soumis',
    'valide',
    'refuse',
    'commande',
];

export const STATUTS_COMMANDE: StatutCommande[] = [
    'brouillon',
    'envoyee',
    'confirmee',
    'partiellement_recue',
    'recue',
    'annulee',
];

export const PRIORITES: PrioriteBesoin[] = ['haute', 'normale', 'basse'];

type Variant = 'default' | 'secondary' | 'destructive' | 'outline';

const STATUT_BESOIN_VARIANTS: Record<StatutBesoin, Variant> = {
    brouillon: 'outline',
    soumis: 'default',
    valide: 'secondary',
    refuse: 'destructive',
    commande: 'secondary',
};

const STATUT_COMMANDE_VARIANTS: Record<StatutCommande, Variant> = {
    brouillon: 'outline',
    envoyee: 'default',
    confirmee: 'default',
    partiellement_recue: 'secondary',
    recue: 'secondary',
    annulee: 'destructive',
};

const PRIORITE_VARIANTS: Record<PrioriteBesoin, Variant> = {
    haute: 'destructive',
    normale: 'secondary',
    basse: 'outline',
};

export function StatutBesoinBadge({ statut }: { statut: StatutBesoin }) {
    return (
        <Badge variant={STATUT_BESOIN_VARIANTS[statut]}>
            {STATUT_BESOIN_LABELS[statut]}
        </Badge>
    );
}

export function StatutCommandeBadge({ statut }: { statut: StatutCommande }) {
    return (
        <Badge variant={STATUT_COMMANDE_VARIANTS[statut]}>
            {STATUT_COMMANDE_LABELS[statut]}
        </Badge>
    );
}

export function PrioriteBadge({ priorite }: { priorite: PrioriteBesoin }) {
    return (
        <Badge variant={PRIORITE_VARIANTS[priorite]}>
            {PRIORITE_LABELS[priorite]}
        </Badge>
    );
}

export function nomComplet(personne: Personne | null | undefined): string {
    return personne ? `${personne.prenom} ${personne.nom}` : '—';
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

export function fmtMontant(montant: number): string {
    return `${Number(montant).toLocaleString('fr-FR')} FCFA`;
}
