import { router } from "@inertiajs/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Users, DoorOpen, Bath, RulerIcon, MapPin, Ban, PawPrint, TriangleAlert } from "lucide-react";
import { bookingSchema, type BookingSchema } from "@/lib/validators";
import { getNights, computeBookingTotal, formatPrice } from "@/lib/data";
import { equipementIcon } from "@/lib/equipement-icons";
import ImageCarousel from "@/components/shared/ImageCarousel";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { cn } from "@/lib/utils";
import type { ApartmentDetail } from "@/types";

const TYPE_LABELS: Record<string, string> = {
  studio: "Studio",
  t2: "T2",
  t3: "T3",
  t4_plus: "T4+",
  penthouse: "Penthouse",
  villa: "Villa",
};

function heuresRestantes(disponibleLe: string): number {
  return Math.max(0, Math.ceil((new Date(disponibleLe).getTime() - Date.now()) / 3_600_000));
}

// ─── Booking Box ──────────────────────────────────────────────────────────────
function BookingBox({
  pricePerNight,
  maxGuests,
  aptId,
  indisponible,
}: {
  pricePerNight: number;
  maxGuests: number;
  aptId: number;
  indisponible: boolean;
}) {
  const today = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BookingSchema>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { checkin: "", checkout: "", guests: "" },
  });

  const checkinVal  = watch("checkin");
  const checkoutVal = watch("checkout");
  const nights = getNights(checkinVal, checkoutVal);
  const pricing = nights > 0 ? computeBookingTotal(pricePerNight, nights) : null;

  const onSubmit = (data: BookingSchema) => {
    const params = new URLSearchParams({ apt_id: String(aptId), ...data });
    router.get(`/checkout?${params.toString()}`);
  };

  return (
    <div className="bg-white border border-[rgb(var(--gold))]/18 rounded-xl p-6 sticky top-[80px] shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
      {/* Price */}
      <div className="font-['Cormorant_Garamond'] text-4xl text-[rgb(var(--dark))] mb-1">
        {pricePerNight} FCFA{" "}
        <span className="font-['DM_Sans'] text-sm text-stone-400 font-light">/ nuit</span>
      </div>

      <hr className="border-[rgb(var(--gold))]/15 my-4" />

      {indisponible ? (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
          Cet appartement n'est pas réservable pour le moment.
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Date pickers */}
          <div className="grid grid-cols-2 border border-stone-200 rounded-lg overflow-hidden mb-3">
            <div className="p-3 border-r border-stone-200">
              <label className="form-label-ls text-[10px]">Arrivée</label>
              <input
                {...register("checkin")}
                type="date"
                min={today}
                className={cn("w-full text-sm outline-none bg-transparent border-none p-0 cursor-pointer", errors.checkin && "text-red-500")}
              />
              {errors.checkin && (
                <p className="text-[10px] text-red-500 mt-0.5">{errors.checkin.message}</p>
              )}
            </div>
            <div className="p-3">
              <label className="form-label-ls text-[10px]">Départ</label>
              <input
                {...register("checkout")}
                type="date"
                min={checkinVal || today}
                className={cn("w-full text-sm outline-none bg-transparent border-none p-0 cursor-pointer", errors.checkout && "text-red-500")}
              />
              {errors.checkout && (
                <p className="text-[10px] text-red-500 mt-0.5">{errors.checkout.message}</p>
              )}
            </div>
          </div>

          {/* Guests */}
          <div className="mb-4">
            <label className="form-label-ls">Voyageurs</label>
            <select
              {...register("guests")}
              className={`input-ls ${errors.guests ? "error" : ""}`}
            >
              <option value="">Sélectionner</option>
              {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} personne{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
            {errors.guests && (
              <p className="text-[11px] text-red-500 mt-1">{errors.guests.message}</p>
            )}
          </div>

          {/* Price summary */}
          {pricing && (
            <div className="bg-[rgb(var(--cream-2))]/70 rounded-lg p-4 mb-4 text-sm">
              <div className="flex justify-between py-1.5 border-b border-[rgb(var(--gold))]/10">
                <span className="text-stone-500">
                  {pricePerNight} FCFA × {nights} nuit{nights > 1 ? "s" : ""}
                </span>
                <span>{formatPrice(pricing.base)} FCFA</span>
              </div>
              {pricing.fee > 0 && (
                <div className="flex justify-between py-1.5 border-b border-[rgb(var(--gold))]/10">
                  <span className="text-stone-500">Frais de service</span>
                  <span>{formatPrice(pricing.fee)} FCFA</span>
                </div>
              )}
              <div className="flex justify-between pt-2 font-semibold">
                <span>Total</span>
                <span>{formatPrice(pricing.total)} FCFA</span>
              </div>
            </div>
          )}

          <button type="submit" className="btn-gold w-full justify-center py-3.5">
            📅 Réserver maintenant
          </button>
        </form>
      )}

      <p className="text-center text-[11px] text-stone-400 mt-3">
        🔒 Annulation gratuite jusqu'à 48h avant l'arrivée
      </p>
    </div>
  );
}

// ─── ApartmentDetailPage ──────────────────────────────────────────────────────
export default function ApartmentDetailPage({ appartement }: { appartement: ApartmentDetail }) {
  const titre = appartement.titre ?? appartement.numero;
  const enMaintenance = appartement.statut_entretien !== "propre";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-[rgb(var(--dark))] border-b border-[rgb(var(--gold))]/10 px-6 py-2.5">
        <div className="max-w-7xl mx-auto text-xs text-white/30">
          <a href="/" className="hover:text-white/50 transition-colors">Accueil</a>
          {" › "}
          <a href="/appartements" className="hover:text-white/50 transition-colors">Appartements</a>
          {" › "}
          <span className="text-[rgb(var(--gold))]">{titre}</span>
        </div>
      </div>

      {/* ── Carousel ── */}
      <ImageCarousel images={appartement.photos} title={titre} />

      {/* ── Detail + Booking ── */}
      <div className="max-w-7xl mx-auto w-full px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">

          {/* LEFT: description */}
          <div>
            {/* Header */}
            {appartement.adresse && (
              <p className="text-[11px] tracking-[0.08em] uppercase text-[rgb(var(--gold))] mb-1 flex items-center gap-1">
                <MapPin size={11} /> {appartement.adresse}
              </p>
            )}
            <h1 className="font-['Cormorant_Garamond'] text-5xl font-light text-[rgb(var(--dark))] mb-3">
              {titre}
            </h1>

            {enMaintenance && (
              <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-full px-4 py-2 mb-5 text-sm">
                <TriangleAlert size={14} />
                Indisponible
                {appartement.disponible_le && (
                  <> — de retour sous ~{heuresRestantes(appartement.disponible_le)}h</>
                )}
              </div>
            )}

            {/* Pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {appartement.type && (
                <div className="flex items-center gap-1.5 border border-[rgb(var(--gold))]/22 rounded-full px-3 py-1.5 text-xs">
                  {TYPE_LABELS[appartement.type]}
                </div>
              )}
              {appartement.chambres != null && (
                <div className="flex items-center gap-1.5 border border-[rgb(var(--gold))]/22 rounded-full px-3 py-1.5 text-xs">
                  <DoorOpen size={12} className="text-[rgb(var(--gold))]" /> {appartement.chambres} chambre{appartement.chambres > 1 ? "s" : ""}
                </div>
              )}
              {appartement.salles_de_bain != null && (
                <div className="flex items-center gap-1.5 border border-[rgb(var(--gold))]/22 rounded-full px-3 py-1.5 text-xs">
                  <Bath size={12} className="text-[rgb(var(--gold))]" /> {appartement.salles_de_bain} SDB
                </div>
              )}
              {appartement.surface_m2 != null && (
                <div className="flex items-center gap-1.5 border border-[rgb(var(--gold))]/22 rounded-full px-3 py-1.5 text-xs">
                  <RulerIcon size={12} className="text-[rgb(var(--gold))]" /> {Number(appartement.surface_m2)} m²
                </div>
              )}
              <div className="flex items-center gap-1.5 border border-[rgb(var(--gold))]/22 rounded-full px-3 py-1.5 text-xs">
                <Users size={12} className="text-[rgb(var(--gold))]" /> {appartement.capacite} pers. max
              </div>
            </div>

            <div className="w-10 h-0.5 bg-[rgb(var(--gold))] mb-5" />

            {/* Description */}
            {appartement.description && (
              <>
                <h4 className="font-['Cormorant_Garamond'] text-2xl mb-3">Description</h4>
                <p className="text-sm text-stone-500 leading-relaxed mb-8">{appartement.description}</p>
              </>
            )}

            {/* Équipements */}
            {appartement.equipements.length > 0 && (
              <>
                <h4 className="font-['Cormorant_Garamond'] text-2xl mb-4">Équipements</h4>
                <div className="grid grid-cols-2 gap-x-8 mb-8">
                  {appartement.equipements.map((eq) => {
                    const Icon = equipementIcon(eq.icone);
                    return (
                      <div key={eq.id} className="flex items-center gap-2.5 py-2.5 border-b border-[rgb(var(--gold))]/8 text-sm">
                        <Icon size={15} className="text-[rgb(var(--gold))]" />
                        {eq.nom}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Rules */}
            <div className="bg-[rgb(var(--cream-2))]/60 border border-[rgb(var(--gold))]/12 rounded-xl p-5 mb-8">
              <h6 className="text-[10px] tracking-[0.14em] uppercase text-[rgb(var(--gold))] font-semibold mb-4">
                Règles du séjour
              </h6>
              <div className="grid grid-cols-2 gap-3 text-sm text-stone-500">
                <div className="flex items-center gap-2">
                  <Ban size={13} className="text-[rgb(var(--gold))]" /> Non-fumeur
                </div>
                <div className="flex items-center gap-2">
                  <PawPrint size={13} className="text-[rgb(var(--gold))]" /> Animaux non admis
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Booking box */}
          <div>
            <BookingBox
              pricePerNight={Number(appartement.prix_nuit)}
              maxGuests={appartement.capacite}
              aptId={appartement.id}
              indisponible={enMaintenance}
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
