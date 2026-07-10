import type { Apartment } from "@/types";

export const APARTMENTS: Apartment[] = [
  {
    id: 1,
    title: "Suite Haussmann",
    subtitle: "Élégance parisienne au cœur du 8e arrondissement",
    location: "Paris, 8e arrondissement",
    address: "24 Avenue George V, 75008 Paris, France",
    lat: 48.8698,
    lng: 2.3007,
    pricePerNight: 285,
    rating: 4.9,
    reviewCount: 42,
    rooms: 3,
    bathrooms: 2,
    sqm: 95,
    maxGuests: 6,
    badge: "Nouveau",
    badgeVariant: "gold",
    checkIn: "15:00",
    checkOut: "11:00",
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80",
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80",
    ],
    amenities: [
      { icon: "Wifi", label: "Wifi haut débit" },
      { icon: "Snowflake", label: "Climatisation" },
      { icon: "Tv", label: "Smart TV 4K" },
      { icon: "UtensilsCrossed", label: "Cuisine équipée" },
      { icon: "Car", label: "Parking privé" },
      { icon: "Lock", label: "Accès sécurisé" },
      { icon: "WashingMachine", label: "Machine à laver" },
      { icon: "ConciergeBell", label: "Conciergerie" },
    ],
    reviews: [
      { id: 1, name: "Sophie M.", date: "Mars 2024", rating: 5, text: "Un séjour absolument magique. L'appartement est encore plus beau qu'en photos, la vue est spectaculaire et le service de conciergerie est aux petits soins." },
      { id: 2, name: "Jean-Luc B.", date: "Février 2024", rating: 5, text: "Emplacement parfait, appartement somptueux. Tout était impeccable. Nous reviendrons sans hésiter." },
      { id: 3, name: "Amina K.", date: "Janvier 2024", rating: 4, text: "Très bel appartement avec une déco soignée. Quelques petits détails à améliorer mais globalement une excellente expérience." },
    ],
  },
  {
    id: 2,
    title: "Loft Plateau",
    subtitle: "Modernité et vue panoramique sur le Plateau",
    location: "Abidjan, Plateau",
    address: "Rue du Commerce, Plateau, Abidjan, Côte d'Ivoire",
    lat: 5.3167,
    lng: -4.0167,
    pricePerNight: 120,
    rating: 4.8,
    reviewCount: 67,
    rooms: 2,
    bathrooms: 1,
    sqm: 70,
    maxGuests: 4,
    badge: "Top",
    badgeVariant: "blue",
    checkIn: "14:00",
    checkOut: "11:00",
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80",
    ],
    amenities: [
      { icon: "Wifi", label: "Wifi haut débit" },
      { icon: "Snowflake", label: "Climatisation" },
      { icon: "UtensilsCrossed", label: "Cuisine équipée" },
      { icon: "Lock", label: "Accès sécurisé" },
    ],
    reviews: [
      { id: 1, name: "Kofi A.", date: "Avril 2024", rating: 5, text: "Appartement moderne et bien équipé. Vue splendide sur la baie d'Abidjan." },
    ],
  },
  {
    id: 3,
    title: "Penthouse Almadies",
    subtitle: "Face à l'Atlantique, luxe absolu",
    location: "Dakar, Almadies",
    address: "Route des Almadies, Dakar, Sénégal",
    lat: 14.7274,
    lng: -17.4975,
    pricePerNight: 340,
    rating: 5.0,
    reviewCount: 18,
    rooms: 4,
    bathrooms: 3,
    sqm: 140,
    maxGuests: 8,
    badge: "Exclusif",
    badgeVariant: "gold",
    checkIn: "15:00",
    checkOut: "12:00",
    images: [
      "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
    ],
    amenities: [
      { icon: "Wifi", label: "Wifi haut débit" },
      { icon: "Snowflake", label: "Climatisation" },
      { icon: "Tv", label: "Smart TV 4K" },
      { icon: "UtensilsCrossed", label: "Cuisine équipée" },
      { icon: "Car", label: "Parking privé" },
      { icon: "Waves", label: "Vue sur l'océan" },
      { icon: "ConciergeBell", label: "Conciergerie" },
    ],
    reviews: [],
  },
  {
    id: 4,
    title: "Appartement Cocody",
    subtitle: "Charme et verdure dans le quartier résidentiel",
    location: "Abidjan, Cocody",
    address: "Boulevard de France, Cocody, Abidjan",
    lat: 5.3544,
    lng: -3.9978,
    pricePerNight: 95,
    rating: 4.7,
    reviewCount: 53,
    rooms: 2,
    bathrooms: 1,
    sqm: 65,
    maxGuests: 3,
    badge: "Promo",
    badgeVariant: "green",
    checkIn: "14:00",
    checkOut: "11:00",
    images: [
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&q=80",
    ],
    amenities: [
      { icon: "Wifi", label: "Wifi" },
      { icon: "Snowflake", label: "Climatisation" },
      { icon: "UtensilsCrossed", label: "Cuisine équipée" },
    ],
    reviews: [],
  },
  {
    id: 5,
    title: "Studio Marais",
    subtitle: "Cocon parisien au cœur du Marais historique",
    location: "Paris, 4e arrondissement",
    address: "Rue de Bretagne, 75003 Paris, France",
    lat: 48.8605,
    lng: 2.3617,
    pricePerNight: 175,
    rating: 4.6,
    reviewCount: 91,
    rooms: 1,
    bathrooms: 1,
    sqm: 38,
    maxGuests: 2,
    badge: "Populaire",
    badgeVariant: "blue",
    checkIn: "15:00",
    checkOut: "11:00",
    images: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80",
    ],
    amenities: [
      { icon: "Wifi", label: "Wifi" },
      { icon: "Snowflake", label: "Climatisation" },
      { icon: "Lock", label: "Accès sécurisé" },
    ],
    reviews: [],
  },
  {
    id: 6,
    title: "Villa Bord de Mer",
    subtitle: "Villa d'architecte avec piscine privée",
    location: "Abidjan, Marcory",
    address: "Boulevard de Marseille, Marcory, Abidjan",
    lat: 5.2888,
    lng: -3.9681,
    pricePerNight: 210,
    rating: 4.9,
    reviewCount: 11,
    rooms: 5,
    bathrooms: 3,
    sqm: 200,
    maxGuests: 10,
    badge: "Nouveau",
    badgeVariant: "gold",
    checkIn: "15:00",
    checkOut: "12:00",
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
    ],
    amenities: [
      { icon: "Wifi", label: "Wifi" },
      { icon: "Snowflake", label: "Climatisation" },
      { icon: "Waves", label: "Piscine privée" },
      { icon: "Car", label: "Parking" },
      { icon: "UtensilsCrossed", label: "Cuisine équipée" },
    ],
    reviews: [],
  },
];

export function getNights(checkin: string, checkout: string): number {
  if (!checkin || !checkout) return 0;
  return Math.max(
    0,
    Math.round(
      (new Date(checkout).getTime() - new Date(checkin).getTime()) / 86_400_000
    )
  );
}

export function formatPrice(n: number): string {
  return n.toLocaleString("fr-FR");
}

export function computeBookingTotal(
  pricePerNight: number,
  nights: number
): { base: number; fee: number; total: number } {
  const base = pricePerNight * nights;
  const fee = Math.round(base * 0.12);
  return { base, fee, total: base + fee };
}