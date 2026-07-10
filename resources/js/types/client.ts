export interface Apartment {
  id: number;
  title: string;
  subtitle: string;
  location: string;
  address: string;
  lat: number;
  lng: number;
  pricePerNight: number;
  rating: number;
  reviewCount: number;
  rooms: number;
  bathrooms: number;
  sqm: number;
  maxGuests: number;
  images: string[];
  badge?: string;
  badgeVariant?: "gold" | "blue" | "green";
  amenities: Amenity[];
  reviews: Review[];
  checkIn: string;
  checkOut: string;
}

export interface Amenity {
  icon: string;
  label: string;
}

export interface Review {
  id: number;
  name: string;
  date: string;
  rating: number;
  text: string;
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