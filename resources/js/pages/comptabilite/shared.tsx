import { Badge } from '@/components/ui/badge';

/**
 * Vocabulaire commun aux écrans de la Comptabilité avancée (Phase 06).
 *
 * Les transitions autorisées ne sont jamais reconstruites ici : chaque facture
 * fournisseur arrive du serveur avec son champ `transitions`, dérivé de
 * `FactureFournisseur::TRANSITIONS`. L'écran affiche ce que le serveur permet.
 */
export type StatutAchat = 'a_valider' | 'validee' | 'payee' | 'annulee';

export type NatureLigne = 'charge' | 'immobilisation';

export type CategorieCharge =
    | 'achats_consommables'
    | 'services_exterieurs'
    | 'personnel'
    | 'impots_taxes'
    | 'charges_financieres'
    | 'autres';

export type ModePaiementFournisseur =
    | 'especes'
    | 'virement'
    | 'mobile_money'
    | 'cheque';

export type CanalRelance = 'email' | 'telephone' | 'courrier' | 'sur_place';

export type Employe = {
    id: number;
    nom: string;
    prenom: string;
    poste: string | null;
};

export type FournisseurRef = { id: number; nom: string };

export type LigneAchat = {
    id: number;
    designation: string;
    quantite: number;
    prix_unitaire: number;
    montant: number;
    nature: NatureLigne;
    categorie: CategorieCharge | null;
};

export type AchatRow = {
    id: number;
    reference: string | null;
    statut: StatutAchat;
    date_facture: string | null;
    date_echeance: string | null;
    date_paiement: string | null;
    mode_paiement: ModePaiementFournisseur | null;
    montant_total: number;
    montant_charges: number;
    montant_immobilise: number;
    en_retard: boolean;
    motif_rejet: string | null;
    notes: string | null;
    fournisseur: FournisseurRef | null;
    commande: string | null;
    valideur: string | null;
    transitions: StatutAchat[];
    lignes: LigneAchat[];
};

/** Une commande réceptionnée, servie pour pré-remplir une facture sans ressaisie. */
export type CommandeFacturable = {
    id: number;
    reference: string | null;
    statut: string;
    date_commande: string | null;
    fournisseur: FournisseurRef | null;
    lignes: {
        commande_ligne_id: number;
        designation: string;
        quantite_commandee: number;
        quantite: number;
        prix_unitaire: number;
        nature: NatureLigne;
    }[];
};

export const STATUT_ACHAT_LABELS: Record<StatutAchat, string> = {
    a_valider: 'À valider',
    validee: 'Validée',
    payee: 'Payée',
    annulee: 'Annulée',
};

export const NATURE_LABELS: Record<NatureLigne, string> = {
    charge: 'Charge',
    immobilisation: 'Immobilisation',
};

export const CATEGORIE_LABELS: Record<CategorieCharge, string> = {
    achats_consommables: 'Achats consommables',
    services_exterieurs: 'Services extérieurs',
    personnel: 'Personnel',
    impots_taxes: 'Impôts et taxes',
    charges_financieres: 'Charges financières',
    autres: 'Autres charges',
};

export const MODE_PAIEMENT_LABELS: Record<ModePaiementFournisseur, string> = {
    especes: 'Espèces',
    virement: 'Virement',
    mobile_money: 'Mobile money',
    cheque: 'Chèque',
};

export const CANAL_LABELS: Record<CanalRelance, string> = {
    email: 'E-mail',
    telephone: 'Téléphone',
    courrier: 'Courrier',
    sur_place: 'Sur place',
};

export const STATUTS_ACHAT: StatutAchat[] = [
    'a_valider',
    'validee',
    'payee',
    'annulee',
];

type Variant = 'default' | 'secondary' | 'destructive' | 'outline';

const STATUT_ACHAT_VARIANTS: Record<StatutAchat, Variant> = {
    a_valider: 'default',
    validee: 'secondary',
    payee: 'secondary',
    annulee: 'destructive',
};

export function StatutAchatBadge({ statut }: { statut: StatutAchat }) {
    return (
        <Badge variant={STATUT_ACHAT_VARIANTS[statut]}>
            {STATUT_ACHAT_LABELS[statut]}
        </Badge>
    );
}

/**
 * L'immobilisation porte un badge distinct de la charge : c'est la seule information de
 * la ligne qui change le compte de résultat, elle ne doit pas se lire en petit.
 */
export function NatureBadge({ nature }: { nature: NatureLigne }) {
    return (
        <Badge variant={nature === 'immobilisation' ? 'default' : 'outline'}>
            {NATURE_LABELS[nature]}
        </Badge>
    );
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
