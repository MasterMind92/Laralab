import { z } from "zod";

// ══════════════════════════════════════════════════════════════
// SEARCH FORM
// ══════════════════════════════════════════════════════════════
export const searchSchema = z
  .object({
    destination: z
      .string()
      .min(2, "Veuillez saisir au moins 2 caractères.")
      .max(100),
    checkin: z.string().min(1, "La date d'arrivée est requise."),
    checkout: z.string().min(1, "La date de départ est requise."),
    guests: z.string().min(1, "Sélectionnez le nombre de voyageurs."),
    type: z.string().optional(),
  })
  .refine(
    (d) => {
      if (!d.checkin || !d.checkout) return true;
      return new Date(d.checkout) > new Date(d.checkin);
    },
    { message: "Le départ doit être après l'arrivée.", path: ["checkout"] }
  );

export type SearchSchema = z.infer<typeof searchSchema>;

// ══════════════════════════════════════════════════════════════
// FILTER FORM
// ══════════════════════════════════════════════════════════════
export const filterSchema = z
  .object({
    destination: z.string().optional(),
    checkin: z.string().optional(),
    checkout: z.string().optional(),
    priceMin: z.string().optional(),
    priceMax: z.string().optional(),
    types: z.array(z.string()).optional(),
    amenities: z.array(z.string()).optional(),
  })
  .refine(
    (d) => {
      if (!d.checkin || !d.checkout) return true;
      return new Date(d.checkout) > new Date(d.checkin);
    },
    { message: "Le départ doit être après l'arrivée.", path: ["checkout"] }
  )
  .refine(
    (d) => {
      if (!d.priceMin || !d.priceMax) return true;
      return parseFloat(d.priceMax) > parseFloat(d.priceMin);
    },
    { message: "Le budget max doit être supérieur au min.", path: ["priceMax"] }
  );

export type FilterSchema = z.infer<typeof filterSchema>;

// ══════════════════════════════════════════════════════════════
// BOOKING QUICK FORM (on detail page)
// ══════════════════════════════════════════════════════════════
export const bookingSchema = z
  .object({
    checkin: z.string().min(1, "La date d'arrivée est requise."),
    checkout: z.string().min(1, "La date de départ est requise."),
    guests: z.string().min(1, "Sélectionnez le nombre de voyageurs."),
  })
  .refine(
    (d) => {
      if (!d.checkin || !d.checkout) return true;
      return new Date(d.checkout) > new Date(d.checkin);
    },
    { message: "Le départ doit être après l'arrivée.", path: ["checkout"] }
  );

export type BookingSchema = z.infer<typeof bookingSchema>;
