import { useForm } from "@inertiajs/react";
import { useState, type FormEvent } from "react";
import { User, CreditCard, Smartphone, CheckCircle, Shield, TriangleAlert } from "lucide-react";
import ReservationController from "@/actions/App/Http/Controllers/PortailClient/ReservationController";
import { formatPrice } from "@/lib/data";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

type PaymentMethod = "card" | "paypal" | "mobile";

// ─── Formatage des champs de carte bancaire (décoratif — Phase 03) ───────────
function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return (digits.match(/.{1,4}/g) ?? []).join(" ");
}

function formatCardExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

function formatCardCvv(value: string): string {
  return value.replace(/\D/g, "").slice(0, 4);
}

type CheckoutAppartement = {
  id: number;
  titre: string;
  adresse: string | null;
  photo: string | null;
  prix_nuit: string;
};

type Pricing = {
  base: number;
  fee: number;
  total: number;
};

type CheckoutClient = {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
};

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

// ─── Payment method button (décoratif — aucun paiement réel, Phase 03) ────────
function PayMethodBtn({
  icon: Icon,
  label,
  value,
  current,
  onSelect,
}: {
  icon: React.ElementType;
  label: string;
  value: PaymentMethod;
  current: PaymentMethod;
  onSelect: (v: PaymentMethod) => void;
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
function OrderSummary({
  appartement,
  checkin,
  checkout,
  guests,
  nights,
  pricing,
}: {
  appartement: CheckoutAppartement;
  checkin: string;
  checkout: string;
  guests: string;
  nights: number;
  pricing: Pricing;
}) {
  const fmt = (d: string) =>
    d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—";

  const cancelDate = checkin
    ? new Date(new Date(checkin).getTime() - 2 * 86_400_000).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
    : "—";

  return (
    <div className="bg-white border border-[rgb(var(--gold))]/15 rounded-xl overflow-hidden sticky top-[80px]">
      {appartement.photo && (
        <img src={appartement.photo} alt={appartement.titre} className="w-full h-44 object-cover" />
      )}

      <div className="p-5">
        <h4 className="font-['Cormorant_Garamond'] text-xl mb-1">{appartement.titre}</h4>
        {appartement.adresse && (
          <p className="text-[11px] uppercase tracking-wider text-[rgb(var(--gold))] mb-4">📍 {appartement.adresse}</p>
        )}

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
        {nights > 0 ? (
          <div className="border-t border-[rgb(var(--gold))]/10 pt-4 flex flex-col gap-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">{appartement.prix_nuit} FCFA × {nights} nuit{nights > 1 ? "s" : ""}</span>
              <span>{formatPrice(pricing.base)} FCFA</span>
            </div>
            {pricing.fee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Frais de service</span>
                <span>{formatPrice(pricing.fee)} FCFA</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-base mt-2 pt-2 border-t border-stone-100">
              <span>Total</span>
              <span className="font-['Cormorant_Garamond'] text-2xl">{formatPrice(pricing.total)} FCFA</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-stone-400 italic text-center">Dates invalides</p>
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
export default function CheckoutPage({
  appartement,
  checkin,
  checkout,
  guests,
  nights,
  pricing,
  disponible,
  client,
  confirmed,
}: {
  appartement: CheckoutAppartement;
  checkin: string;
  checkout: string;
  guests: string;
  nights: number;
  pricing: Pricing;
  disponible: boolean;
  client: CheckoutClient;
  confirmed: boolean;
}) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const { data, setData, errors, processing, post } = useForm({
    prenom: client.prenom,
    nom: client.nom,
    email: client.email,
    telephone: client.telephone,
    notes: "",
    terms: false,
    appartement_id: appartement.id,
    date_debut: checkin,
    date_fin: checkout,
    nombre_personnes: guests ? Number(guests) : undefined,
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    post(ReservationController.store().url, { preserveScroll: true });
  };

  if (confirmed) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="text-center max-w-md">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-6" />
            <h2 className="font-['Cormorant_Garamond'] text-4xl mb-3">Réservation confirmée !</h2>
            <p className="text-stone-500 mb-2">Votre demande de réservation a bien été enregistrée.</p>
            <p className="text-stone-400 text-sm mb-8">
              {appartement.titre}
              {appartement.adresse ? ` · ${appartement.adresse}` : ""}
            </p>
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

        {!disponible && (
          <div className="mb-6 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-4 py-3 text-sm">
            <TriangleAlert size={16} />
            Cet appartement n'est plus disponible sur ces dates. Choisissez d'autres dates depuis sa fiche.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">

          {/* ── LEFT: Form ── */}
          <form onSubmit={onSubmit} noValidate>

            {/* ── 1. Coordonnées ── */}
            <div className="bg-white rounded-xl border border-[rgb(var(--gold))]/12 p-6 mb-5">
              <h3 className="font-['Cormorant_Garamond'] text-2xl flex items-center gap-2 mb-5 pb-3 border-b border-[rgb(var(--gold))]/10">
                <User size={16} className="text-[rgb(var(--gold))]" /> Vos coordonnées
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="form-label-ls">Prénom *</label>
                  <input
                    value={data.prenom}
                    onChange={(e) => setData("prenom", e.target.value)}
                    placeholder="Jean"
                    className={cn("input-ls", errors.prenom && "error")}
                  />
                  {errors.prenom && <p className="text-[11px] text-red-500 mt-1">{errors.prenom}</p>}
                </div>
                <div>
                  <label className="form-label-ls">Nom *</label>
                  <input
                    value={data.nom}
                    onChange={(e) => setData("nom", e.target.value)}
                    placeholder="Dupont"
                    className={cn("input-ls", errors.nom && "error")}
                  />
                  {errors.nom && <p className="text-[11px] text-red-500 mt-1">{errors.nom}</p>}
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label-ls">Adresse e-mail *</label>
                <input
                  value={data.email}
                  onChange={(e) => setData("email", e.target.value)}
                  type="email"
                  placeholder="jean.dupont@email.com"
                  className={cn("input-ls", errors.email && "error")}
                />
                {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div className="mb-4">
                <label className="form-label-ls">Téléphone</label>
                <input
                  value={data.telephone}
                  onChange={(e) => setData("telephone", e.target.value)}
                  type="tel"
                  placeholder="+225 07 00 00 00 00"
                  className={cn("input-ls", errors.telephone && "error")}
                />
                {errors.telephone && <p className="text-[11px] text-red-500 mt-1">{errors.telephone}</p>}
              </div>

              <div>
                <label className="form-label-ls">Demandes spéciales</label>
                <textarea
                  value={data.notes}
                  onChange={(e) => setData("notes", e.target.value)}
                  rows={3}
                  placeholder="Arrivée tardive, lit bébé, étage élevé…"
                  className="input-ls resize-none"
                />
              </div>
            </div>

            {/* ── 2. Paiement (décoratif — Phase 03) ── */}
            <div className="bg-white rounded-xl border border-[rgb(var(--gold))]/12 p-6 mb-5">
              <h3 className="font-['Cormorant_Garamond'] text-2xl flex items-center gap-2 mb-5 pb-3 border-b border-[rgb(var(--gold))]/10">
                <CreditCard size={16} className="text-[rgb(var(--gold))]" /> Mode de paiement
              </h3>

              <div className="flex gap-2 flex-wrap mb-5">
                <PayMethodBtn icon={CreditCard}  label="Carte bancaire" value="card"    current={paymentMethod} onSelect={setPaymentMethod} />
                <PayMethodBtn icon={Shield}       label="PayPal"         value="paypal"  current={paymentMethod} onSelect={setPaymentMethod} />
                <PayMethodBtn icon={Smartphone}   label="Mobile Money"   value="mobile"  current={paymentMethod} onSelect={setPaymentMethod} />
              </div>

              {paymentMethod === "card" && (
                <div className="space-y-4">
                  <div className="flex gap-2 mb-1">
                    {["VISA", "Mastercard", "AmEx"].map((b) => (
                      <span key={b} className="text-[10px] border border-stone-200 rounded px-2 py-0.5 text-stone-400 tracking-wide">{b}</span>
                    ))}
                  </div>
                  <div>
                    <label className="form-label-ls">Nom sur la carte</label>
                    <input
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                      placeholder="JEAN DUPONT"
                      className="input-ls uppercase"
                    />
                  </div>
                  <div>
                    <label className="form-label-ls">Numéro de carte</label>
                    <div className="relative">
                      <input
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        inputMode="numeric"
                        autoComplete="cc-number"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className="input-ls pr-10 tracking-widest"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 text-lg">💳</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label-ls">Date d'expiration</label>
                      <input
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatCardExpiry(e.target.value))}
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        placeholder="MM / AA"
                        maxLength={7}
                        className="input-ls"
                      />
                    </div>
                    <div>
                      <label className="form-label-ls">CVV / CVC</label>
                      <input
                        value={cardCvv}
                        onChange={(e) => setCardCvv(formatCardCvv(e.target.value))}
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        type="password"
                        placeholder="•••"
                        maxLength={4}
                        className="input-ls"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === "paypal" && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
                  🅿️ Vous serez redirigé vers <strong>PayPal</strong> pour finaliser le paiement en toute sécurité.
                </div>
              )}

              {paymentMethod === "mobile" && (
                <div className="space-y-4">
                  <div>
                    <label className="form-label-ls">Opérateur</label>
                    <select className="input-ls">
                      <option value="">Choisir l'opérateur</option>
                      {["Orange Money", "MTN Mobile Money", "Wave", "Moov Money"].map((o) => (
                        <option key={o} value={o.toLowerCase().replace(/\s/g, "_")}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label-ls">Numéro Mobile Money</label>
                    <input type="tel" placeholder="+225 07 00 00 00 00" className="input-ls" />
                  </div>
                </div>
              )}

              <p className="text-[11px] text-stone-400 mt-4">
                Le paiement en ligne n'est pas encore actif — cette section deviendra fonctionnelle prochainement.
              </p>
            </div>

            {/* ── 3. CGU ── */}
            <div className="bg-white rounded-xl border border-[rgb(var(--gold))]/12 p-5 mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={data.terms}
                  onChange={(e) => setData("terms", e.target.checked)}
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
            </div>

            {/* ── Submit ── */}
            <button
              type="submit"
              disabled={processing || !disponible}
              className="btn-gold w-full justify-center py-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Shield size={14} />
              {processing
                ? "Traitement en cours…"
                : `Confirmer la réservation${nights > 0 ? ` — ${formatPrice(pricing.total)} FCFA` : ""}`
              }
            </button>
            <p className="text-center text-[11px] text-stone-400 mt-3">
              🔒 Aucun paiement n'est prélevé pour l'instant — votre demande sera confirmée par notre équipe.
            </p>
          </form>

          {/* ── RIGHT: Summary ── */}
          <div>
            <OrderSummary
              appartement={appartement}
              checkin={checkin}
              checkout={checkout}
              guests={guests}
              nights={nights}
              pricing={pricing}
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
