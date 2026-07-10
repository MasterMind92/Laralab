import { z } from "zod";

// ─── Luhn algorithm ────────────────────────────────────────────────────────────
function luhn(value: string): boolean {
  const num = value.replace(/\s/g, "");
  if (!/^\d{13,19}$/.test(num)) return false;
  let sum = 0;
  let alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = parseInt(num[i], 10);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

// ─── Card expiry ───────────────────────────────────────────────────────────────
function validExpiry(value: string): boolean {
  const parts = value.replace(/\s/g, "").split("/");
  if (parts.length !== 2) return false;
  const month = parseInt(parts[0], 10);
  const year = parseInt("20" + parts[1], 10);
  const expDate = new Date(year, month - 1, 1);
  return month >= 1 && month <= 12 && expDate > new Date();
}

// ─── Phone ────────────────────────────────────────────────────────────────────
const phoneRegex = /^[+\d][\d\s\-().]{7,19}$/;

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

// ══════════════════════════════════════════════════════════════
// LOGIN FORM
// ══════════════════════════════════════════════════════════════
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'adresse e-mail est requise.")
    .email("Adresse e-mail invalide."),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères."),
  remember: z.boolean().optional(),
});

export type LoginSchema = z.infer<typeof loginSchema>;

// ══════════════════════════════════════════════════════════════
// REGISTER FORM
// ══════════════════════════════════════════════════════════════
export const registerSchema = z
  .object({
    firstname: z.string().min(2, "Le prénom doit contenir au moins 2 caractères."),
    lastname: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
    email: z
      .string()
      .min(1, "L'adresse e-mail est requise.")
      .email("Adresse e-mail invalide."),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
      .regex(/[A-Z]/, "Incluez au moins une lettre majuscule.")
      .regex(/[0-9]/, "Incluez au moins un chiffre."),
    confirmPassword: z.string().min(1, "Confirmez le mot de passe."),
    terms: z
      .boolean()
      .refine((v) => v === true, "Vous devez accepter les conditions."),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export type RegisterSchema = z.infer<typeof registerSchema>;

// ══════════════════════════════════════════════════════════════
// CHECKOUT FORM
// ══════════════════════════════════════════════════════════════
export const checkoutSchema = z
  .object({
    firstname: z.string().min(2, "Le prénom est requis."),
    lastname: z.string().min(2, "Le nom est requis."),
    email: z.string().email("Adresse e-mail invalide."),
    phone: z
      .string()
      .regex(phoneRegex, "Numéro de téléphone invalide."),
    nationality: z.string().optional(),
    specialRequests: z.string().optional(),
    paymentMethod: z.enum(["card", "paypal", "mobile"]),
    // Card fields (conditionally required)
    cardName: z.string().optional(),
    cardNumber: z.string().optional(),
    cardExpiry: z.string().optional(),
    cardCvv: z.string().optional(),
    // Mobile money
    mmOperator: z.string().optional(),
    mmNumber: z.string().optional(),
    terms: z
      .boolean()
      .refine((v) => v === true, "Vous devez accepter les conditions."),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMethod === "card") {
      if (!data.cardName || data.cardName.trim().length < 3) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Le nom sur la carte est requis.", path: ["cardName"] });
      }
      if (!data.cardNumber || !luhn(data.cardNumber)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Numéro de carte invalide.", path: ["cardNumber"] });
      }
      if (!data.cardExpiry || !validExpiry(data.cardExpiry)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Date d'expiration invalide ou carte expirée.", path: ["cardExpiry"] });
      }
      if (!data.cardCvv || !/^\d{3,4}$/.test(data.cardCvv)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CVV invalide (3 ou 4 chiffres).", path: ["cardCvv"] });
      }
    }
    if (data.paymentMethod === "mobile") {
      if (!data.mmNumber || !phoneRegex.test(data.mmNumber)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Numéro Mobile Money invalide.", path: ["mmNumber"] });
      }
    }
  });

export type CheckoutSchema = z.infer<typeof checkoutSchema>;