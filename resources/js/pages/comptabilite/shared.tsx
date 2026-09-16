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

/* ------------------------------------------------------------ livre de caisse */

/**
 * D'ou vient l'argent qui entre. Une avance rattachee a une facture reste une AVANCE :
 * l'origine dit d'ou vient l'argent, pas dans quel ecran il a ete saisi.
 */
export type OrigineEntree = 'avance' | 'facture';

/** D'ou sort l'argent : le reglement d'une facture fournisseur, ou une saisie a la main. */
export type OrigineSortie = 'facture' | 'saisie_directe';

export type ModeEncaissement =
    | 'cb'
    | 'especes'
    | 'virement'
    | 'mobile_money'
    | 'paypal';

export type EntreeRow = {
    id: number;
    montant: number;
    mode_paiement: ModeEncaissement;
    date_paiement: string | null;
    reference: string | null;
    origine: OrigineEntree;
    rattachee: boolean;
    numero_facture: string | null;
    client: string | null;
    appartement: string | null;
};

export type SortieRow = {
    cle: string;
    origine: OrigineSortie;
    libelle: string;
    tiers: string | null;
    montant: number;
    montant_charges: number;
    montant_immobilise: number;
    date: string | null;
    mode_paiement: string | null;
    reference: string | null;
    categorie: CategorieCharge | null;
    facture_fournisseur_id: number | null;
    depense_id: number | null;
};

export const MODE_ENCAISSEMENT_LABELS: Record<ModeEncaissement, string> = {
    cb: 'Carte bancaire',
    especes: 'Espèces',
    virement: 'Virement',
    mobile_money: 'Mobile money',
    paypal: 'PayPal',
};

export const ORIGINE_ENTREE_LABELS: Record<OrigineEntree, string> = {
    avance: 'Avance à la réservation',
    facture: 'Règlement de facture',
};

export const ORIGINE_SORTIE_LABELS: Record<OrigineSortie, string> = {
    facture: 'Facture fournisseur',
    saisie_directe: 'Saisie directe',
};

export function OrigineEntreeBadge({ origine }: { origine: OrigineEntree }) {
    return (
        <Badge variant={origine === 'avance' ? 'default' : 'outline'}>
            {ORIGINE_ENTREE_LABELS[origine]}
        </Badge>
    );
}

export function OrigineSortieBadge({ origine }: { origine: OrigineSortie }) {
    return (
        <Badge variant={origine === 'facture' ? 'secondary' : 'outline'}>
            {ORIGINE_SORTIE_LABELS[origine]}
        </Badge>
    );
}

/* --------------------------------------------------- extension Phase 06 */

/**
 * Devis équipement : généré automatiquement à l'Enregistrement côté Logistique
 * (`LogistiqueController::genererDevisEquipement()`), jamais créé à la main. Cycle
 * calqué sur `StatutAchat`, mais nommé "brouillon" plutôt que "a_valider" — décision
 * actée lors du cadrage du 2026-09-16.
 */
export type StatutDevisEquipement = 'brouillon' | 'validee' | 'payee' | 'annulee';

export type LigneDevisEquipement = {
    id: number;
    designation: string;
    quantite: number;
    prix_unitaire: number;
    montant: number;
};

export type DevisEquipementRow = {
    id: number;
    statut: StatutDevisEquipement;
    majoration_active: boolean;
    taux_majoration: number | null;
    montant_base: number;
    montant: number;
    date_validation: string | null;
    date_paiement: string | null;
    mode_paiement: ModePaiementFournisseur | null;
    motif_rejet: string | null;
    notes: string | null;
    reception: number | null;
    commande: string | null;
    fournisseur: string | null;
    valideur: string | null;
    transitions: StatutDevisEquipement[];
    lignes: LigneDevisEquipement[];
};

export const STATUT_DEVIS_EQUIPEMENT_LABELS: Record<StatutDevisEquipement, string> = {
    brouillon: 'Brouillon',
    validee: 'Validé',
    payee: 'Payé',
    annulee: 'Annulé',
};

const STATUT_DEVIS_EQUIPEMENT_VARIANTS: Record<StatutDevisEquipement, Variant> = {
    brouillon: 'default',
    validee: 'secondary',
    payee: 'secondary',
    annulee: 'destructive',
};

export function StatutDevisEquipementBadge({ statut }: { statut: StatutDevisEquipement }) {
    return (
        <Badge variant={STATUT_DEVIS_EQUIPEMENT_VARIANTS[statut]}>
            {STATUT_DEVIS_EQUIPEMENT_LABELS[statut]}
        </Badge>
    );
}

/** Registre des immobilisations : lecture cumulative, pas de cycle de statut ici. */
export type ImmobilisationRow = {
    id: number;
    date_facture: string | null;
    fournisseur: string | null;
    designation: string;
    montant: number;
    appartement: string;
    statut: 'Actif' | 'Réformé';
    garantie_fin: string | null;
};

/** Avances de réservation : acomptes portail, "rapprochée" une fois liés à une facture. */
export type EtatAvance = 'en_attente' | 'rapprochee';

export type AvanceRow = {
    id: number;
    montant: number;
    date_paiement: string | null;
    client: string | null;
    appartement: string | null;
    numero_facture: string | null;
    etat: EtatAvance;
};

export const ETAT_AVANCE_LABELS: Record<EtatAvance, string> = {
    en_attente: 'En attente de facturation',
    rapprochee: 'Rapprochée',
};

export function EtatAvanceBadge({ etat }: { etat: EtatAvance }) {
    return (
        <Badge variant={etat === 'rapprochee' ? 'secondary' : 'outline'}>
            {ETAT_AVANCE_LABELS[etat]}
        </Badge>
    );
}
