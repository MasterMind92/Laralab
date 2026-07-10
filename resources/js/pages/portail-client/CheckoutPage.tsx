"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, CreditCard, Smartphone, CheckCircle, Shield } from "lucide-react";
import { checkoutSchema, type CheckoutSchema } from "@/lib/validators";
import { APARTMENTS, getNights, computeBookingTotal, formatPrice } from "@/lib/data";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

// ─── Steps indicator ──────────────────────────────────────────────────────────
const STEPS = ["Sélection", "Informations", "Paiement", "Confirmation"];

function StepsBar({ current }: { current: number }) {
  return (
    <div className="flex items-center mb-8">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-7 h-7 rounded-full border-2 flex items-center justify-center text-[11px] font-semibold transition-all",
                i < current
                  ? "bg-green-600 border-green-600 text-white"
                  : i === current
                  ? "bg-[rgb(var(--gold))] border-[rgb(var(--gold))] text-[rgb(var(--dark))]"
                  : "border-stone-300 text-stone-400"
              )}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span
              className={cn(
                "hidden sm:block text-[11px] tracking-[0.1em] uppercase font-medium",
                i < current ? "text-green-600" : i === current ? "text-[rgb(var(--gold))]" : "text-stone-400"
              )}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn("flex-1 h-px mx-3 w-8 sm:w-12", i < current ? "bg-green-300" : "bg-stone-200")} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Payment method button ────────────────────────────────────────────────────
function PayMethodBtn({
  icon: Icon,
  label,
  value,
  current,
  onSelect,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  current: string;
  onSelect: (v: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        "flex-1 min-w-[120px] flex items-center gap-2 border-2 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
        current === value
          ? "border-[rgb(var(--gold))] bg-[rgb(var(--gold))]/5 text-[rgb(var(--dark))]"
          : "border-stone-200 text-stone-500 hover:border-stone-300"
      )}
    >
      <Icon size={16} className={current === value ? "text-[rgb(var(--gold))]" : "text-stone-400"} />
      {label}
    </button>
  );
}

// ─── Order Summary ────────────────────────────────────────────────────────────
function OrderSummary({ apt, checkin, checkout, guests, nights }: {
  apt: (typeof APARTMENTS)[0];
  checkin: string;
  checkout: string;
  guests: string;
  nights: number;
}) {
  const pricing = nights > 0 ? computeBookingTotal(apt.pricePerNight, nights) : null;

  const fmt = (d: string) =>
    d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—";

  const cancelDate = checkin
    ? new Date(new Date(checkin).getTime() - 2 * 86_400_000).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
    : "—";

  return (
    <div className="bg-white border border-[rgb(var(--gold))]/15 rounded-xl overflow-hidden sticky top-[80px]">
      <img src={apt.images[0]} alt={apt.title} className="w-full h-44 object-cover" />

      <div className="p-5">
        <h4 className="font-['Cormorant_Garamond'] text-xl mb-1">{apt.title}</h4>
        <p className="text-[11px] uppercase tracking-wider text-[rgb(var(--gold))] mb-4">📍 {apt.location}</p>

        {/* Date tags */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[["Arrivée", fmt(checkin)], ["Départ", fmt(checkout)]].map(([lbl, val]) => (
            <div key={lbl} className="bg-[rgb(var(--cream-2))]/80 border border-[rgb(var(--gold))]/12 rounded-lg p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-stone-400 mb-1">{lbl}</p>
              <p className="text-sm font-medium">{val}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-stone-400 mb-5">
          🌙 {nights > 0 ? `${nights} nuit${nights > 1 ? "s" : ""}` : "—"}
          {" · "}
          👥 {guests ? `${guests} voyageur${Number(guests) > 1 ? "s" : ""}` : "—"}
        </p>

        {/* Price lines */}
        {pricing ? (
          <div className="border-t border-[rgb(var(--gold))]/10 pt-4 flex flex-col gap-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">{apt.pricePerNight}€ × {nights} nuit{nights > 1 ? "s" : ""}</span>
              <span>{formatPrice(pricing.base)}€</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Frais de service (12%)</span>
              <span>{formatPrice(pricing.fee)}€</span>
            </div>
            <div className="flex justify-between font-semibold text-base mt-2 pt-2 border-t border-stone-100">
              <span>Total</span>
              <span className="font-['Cormorant_Garamond'] text-2xl">{formatPrice(pricing.total)}€</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-stone-400 italic text-center">Sélectionnez des dates</p>
        )}

        {/* Guarantees */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2 text-xs text-green-700">
            🔄 Annulation gratuite avant le {cancelDate}
          </div>
          <div className="flex items-center gap-2 bg-[rgb(var(--gold))]/6 border border-[rgb(var(--gold))]/15 rounded-lg px-3 py-2 text-xs text-[rgb(var(--gold-dark))]">
            🛎️ Conciergerie disponible 24h/7j
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CheckoutPage ─────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const searchParams = new URLSearchParams(location.search);
  const [confirmed, setConfirmed] = useState(false);

  const aptId   = Number(searchParams.get("apt_id") ?? 1);
  const checkin  = searchParams.get("checkin")  ?? "";
  const checkout = searchParams.get("checkout") ?? "";
  const guests   = searchParams.get("guests")   ?? "";

  const apt = APARTMENTS.find((a) => a.id === aptId) ?? APARTMENTS[0];
  const nights = getNights(checkin, checkout);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutSchema>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstname: "", lastname: "", email: "", phone: "",
      nationality: "", specialRequests: "",
      paymentMethod: "card",
      cardName: "", cardNumber: "", cardExpiry: "", cardCvv: "",
      mmOperator: "", mmNumber: "", terms: false,
    },
  });

  const paymentMethod = useWatch({ control, name: "paymentMethod" });

  // Format card number with spaces
  const handleCardInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 16);
    v = v.replace(/(.{4})/g, "$1 ").trim();
    setValue("cardNumber", v, { shouldValidate: true });
  };

  // Format MM / YY
  const handleExpiryInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (v.length > 2) v = v.slice(0, 2) + " / " + v.slice(2);
    setValue("cardExpiry", v, { shouldValidate: true });
  };

  const onSubmit = async (_data: CheckoutSchema) => {
    await new Promise((r) => setTimeout(r, 1000));
    setConfirmed(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (confirmed) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="text-center max-w-md">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-6" />
            <h2 className="font-['Cormorant_Garamond'] text-4xl mb-3">Réservation confirmée !</h2>
            <p className="text-stone-500 mb-2">Un e-mail de confirmation vous a été envoyé.</p>
            <p className="text-stone-400 text-sm mb-8">{apt.title} · {apt.location}</p>
            <a href="/" className="btn-gold py-3 px-8">Retour à l'accueil</a>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[rgb(var(--cream))]">
      <Navbar />

      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        <StepsBar current={1} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">

          {/* ── LEFT: Form ── */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>

            {/* ── 1. Coordonnées ── */}
            <div className="bg-white rounded-xl border border-[rgb(var(--gold))]/12 p-6 mb-5">
              <h3 className="font-['Cormorant_Garamond'] text-2xl flex items-center gap-2 mb-5 pb-3 border-b border-[rgb(var(--gold))]/10">
                <User size={16} className="text-[rgb(var(--gold))]" /> Vos coordonnées
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="form-label-ls">Prénom *</label>
                  <input {...register("firstname")} placeholder="Jean" className={cn("input-ls", errors.firstname && "error")} />
                  {errors.firstname && <p className="text-[11px] text-red-500 mt-1">{errors.firstname.message}</p>}
                </div>
                <div>
                  <label className="form-label-ls">Nom *</label>
                  <input {...register("lastname")} placeholder="Dupont" className={cn("input-ls", errors.lastname && "error")} />
                  {errors.lastname && <p className="text-[11px] text-red-500 mt-1">{errors.lastname.message}</p>}
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label-ls">Adresse e-mail *</label>
                <input {...register("email")} type="email" placeholder="jean.dupont@email.com" className={cn("input-ls", errors.email && "error")} />
                {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="form-label-ls">Téléphone *</label>
                  <input {...register("phone")} type="tel" placeholder="+33 6 00 00 00 00" className={cn("input-ls", errors.phone && "error")} />
                  {errors.phone && <p className="text-[11px] text-red-500 mt-1">{errors.phone.message}</p>}
                </div>
                <div>
                  <label className="form-label-ls">Nationalité</label>
                  <select {...register("nationality")} className="input-ls">
                    <option value="">Sélectionner</option>
                    {["Française", "Ivoirienne", "Sénégalaise", "Marocaine", "Autre"].map((n) => (
                      <option key={n} value={n.toLowerCase()}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label-ls">Demandes spéciales</label>
                <textarea
                  {...register("specialRequests")}
                  rows={3}
                  placeholder="Arrivée tardive, lit bébé, étage élevé…"
                  className="input-ls resize-none"
                />
              </div>
            </div>

            {/* ── 2. Paiement ── */}
            <div className="bg-white rounded-xl border border-[rgb(var(--gold))]/12 p-6 mb-5">
              <h3 className="font-['Cormorant_Garamond'] text-2xl flex items-center gap-2 mb-5 pb-3 border-b border-[rgb(var(--gold))]/10">
                <CreditCard size={16} className="text-[rgb(var(--gold))]" /> Mode de paiement
              </h3>

              {/* Method selector */}
              <div className="flex gap-2 flex-wrap mb-5">
                <PayMethodBtn icon={CreditCard}  label="Carte bancaire" value="card"    current={paymentMethod} onSelect={(v) => setValue("paymentMethod", v as "card" | "paypal" | "mobile")} />
                <PayMethodBtn icon={Shield}       label="PayPal"         value="paypal"  current={paymentMethod} onSelect={(v) => setValue("paymentMethod", v as "card" | "paypal" | "mobile")} />
                <PayMethodBtn icon={Smartphone}   label="Mobile Money"   value="mobile"  current={paymentMethod} onSelect={(v) => setValue("paymentMethod", v as "card" | "paypal" | "mobile")} />
              </div>

              {/* ── Card fields ── */}
              {paymentMethod === "card" && (
                <div className="space-y-4">
                  <div className="flex gap-2 mb-1">
                    {["VISA", "Mastercard", "AmEx"].map((b) => (
                      <span key={b} className="text-[10px] border border-stone-200 rounded px-2 py-0.5 text-stone-400 tracking-wide">{b}</span>
                    ))}
                  </div>
                  <div>
                    <label className="form-label-ls">Nom sur la carte *</label>
                    <input {...register("cardName")} placeholder="JEAN DUPONT" className={cn("input-ls", errors.cardName && "error")} />
                    {errors.cardName && <p className="text-[11px] text-red-500 mt-1">{errors.cardName.message}</p>}
                  </div>
                  <div>
                    <label className="form-label-ls">Numéro de carte *</label>
                    <div className="relative">
                      <input
                        {...register("cardNumber")}
                        onChange={handleCardInput}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className={cn("input-ls pr-10", errors.cardNumber && "error")}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 text-lg">💳</span>
                    </div>
                    {errors.cardNumber && <p className="text-[11px] text-red-500 mt-1">{errors.cardNumber.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label-ls">Date d'expiration *</label>
                      <input
                        {...register("cardExpiry")}
                        onChange={handleExpiryInput}
                        placeholder="MM / AA"
                        maxLength={7}
                        className={cn("input-ls", errors.cardExpiry && "error")}
                      />
                      {errors.cardExpiry && <p className="text-[11px] text-red-500 mt-1">{errors.cardExpiry.message}</p>}
                    </div>
                    <div>
                      <label className="form-label-ls">CVV / CVC *</label>
                      <input
                        {...register("cardCvv")}
                        placeholder="•••"
                        maxLength={4}
                        onInput={(e) => { (e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.replace(/\D/g, ""); }}
                        className={cn("input-ls", errors.cardCvv && "error")}
                      />
                      {errors.cardCvv && <p className="text-[11px] text-red-500 mt-1">{errors.cardCvv.message}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* ── PayPal ── */}
              {paymentMethod === "paypal" && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
                  🅿️ Vous serez redirigé vers <strong>PayPal</strong> pour finaliser le paiement en toute sécurité.
                </div>
              )}

              {/* ── Mobile Money ── */}
              {paymentMethod === "mobile" && (
                <div className="space-y-4">
                  <div>
                    <label className="form-label-ls">Opérateur</label>
                    <select {...register("mmOperator")} className="input-ls">
                      <option value="">Choisir l'opérateur</option>
                      {["Orange Money", "MTN Mobile Money", "Wave", "Moov Money"].map((o) => (
                        <option key={o} value={o.toLowerCase().replace(/\s/g, "_")}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label-ls">Numéro Mobile Money *</label>
                    <input
                      {...register("mmNumber")}
                      type="tel"
                      placeholder="+225 07 00 00 00 00"
                      className={cn("input-ls", errors.mmNumber && "error")}
                    />
                    {errors.mmNumber && <p className="text-[11px] text-red-500 mt-1">{errors.mmNumber.message}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* ── 3. CGU ── */}
            <div className="bg-white rounded-xl border border-[rgb(var(--gold))]/12 p-5 mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("terms")}
                  className="mt-0.5 accent-[rgb(var(--gold))]"
                />
                <span className="text-sm text-stone-500 leading-relaxed">
                  J'ai lu et j'accepte les{" "}
                  <a href="#" className="text-[rgb(var(--gold))] hover:underline">conditions générales</a>,
                  la{" "}
                  <a href="#" className="text-[rgb(var(--gold))] hover:underline">politique d'annulation</a>{" "}
                  et les règles du logement.
                </span>
              </label>
              {errors.terms && <p className="text-[11px] text-red-500 mt-2">{errors.terms.message}</p>}
            </div>

            {/* ── Submit ── */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-gold w-full justify-center py-4 text-sm"
            >
              <Shield size={14} />
              {isSubmitting
                ? "Traitement en cours…"
                : `Confirmer et payer${nights > 0 ? ` ${formatPrice(computeBookingTotal(apt.pricePerNight, nights).total)}€` : ""}`
              }
            </button>
            <p className="text-center text-[11px] text-stone-400 mt-3">
              🔒 Paiement 100% sécurisé — données chiffrées SSL
            </p>
          </form>

          {/* ── RIGHT: Summary ── */}
          <div>
            <OrderSummary
              apt={apt}
              checkin={checkin}
              checkout={checkout}
              guests={guests}
              nights={nights}
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}