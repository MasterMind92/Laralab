export type TypeLogement = "studio" | "t2" | "t3" | "t4_plus" | "penthouse" | "villa";
export type StatutEntretien = "propre" | "a_nettoyer" | "en_maintenance";

/** Reflète Appartement::pourPortail() côté backend. */
export interface Apartment {
  id: number;
  numero: string;
  titre: string | null;
  description: string | null;
  adresse: string | null;
  type: TypeLogement | null;
  prix_nuit: string;
  capacite: number;
  chambres: number | null;
  salles_de_bain: number | null;
  surface_m2: string | null;
  photos: string[];
  statut_entretien: StatutEntretien;
  disponible_le: string | null;
}

export interface ApartmentEquipement {
  id: number;
  nom: string;
  icone: string | null;
}

export interface ApartmentDetail extends Apartment {
  equipements: ApartmentEquipement[];
}

export interface SearchFormValues {
  destination: string;
  checkin: string;
  checkout: string;
  guests: string;
  type: string;
}

export interface FilterFormValues {
  destination: string;
  checkin: string;
  checkout: string;
  priceMin: string;
  priceMax: string;
  types: string[];
  amenities: string[];
}

export interface LoginFormValues {
  email: string;
  password: string;
  remember: boolean;
}

export interface RegisterFormValues {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}

export interface CheckoutFormValues {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  nationality: string;
  specialRequests: string;
  paymentMethod: "card" | "paypal" | "mobile";
  cardName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  mmOperator: string;
  mmNumber: string;
  terms: boolean;
}