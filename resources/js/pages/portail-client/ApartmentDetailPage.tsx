import { router } from "@inertiajs/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Users, DoorOpen, Bath, RulerIcon, Star, MapPin, Clock, Ban, PawPrint, ExternalLink } from "lucide-react";
import { bookingSchema, type BookingSchema } from "@/lib/validators";
import { APARTMENTS, getNights, computeBookingTotal, formatPrice } from "@/lib/data";
import ImageCarousel from "@/components/shared/ImageCarousel";
import StarRating  from "@/components/shared/StarRating";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

// ─── Booking Box ──────────────────────────────────────────────────────────────
function BookingBox({ pricePerNight, maxGuests, aptId }: { pricePerNight: number; maxGuests: number; aptId: number }) {
  
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
        {pricePerNight}€{" "}
        <span className="font-['DM_Sans'] text-sm text-stone-400 font-light">/ nuit</span>
      </div>

      <hr className="border-[rgb(var(--gold))]/15 my-4" />

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
                {pricePerNight}€ × {nights} nuit{nights > 1 ? "s" : ""}
              </span>
              <span>{formatPrice(pricing.base)}€</span>
            </div>
            {pricing.fee > 0 && (
              <div className="flex justify-between py-1.5 border-b border-[rgb(var(--gold))]/10">
                <span className="text-stone-500">Frais de service (12%)</span>
                <span>{formatPrice(pricing.fee)}€</span>
              </div>
            )}
            <div className="flex justify-between pt-2 font-semibold">
              <span>Total</span>
              <span>{formatPrice(pricing.total)}€</span>
            </div>
          </div>
        )}

        <button type="submit" className="btn-gold w-full justify-center py-3.5">
          📅 Réserver maintenant
        </button>
      </form>

      <p className="text-center text-[11px] text-stone-400 mt-3">
        🔒 Annulation gratuite jusqu'à 48h avant l'arrivée
      </p>

      {/* Quick facts */}
      <div className="grid grid-cols-3 gap-2 border-t border-[rgb(var(--gold))]/12 mt-4 pt-4 text-center text-xs text-stone-400">
        <div><MapPin size={12} className="mx-auto mb-1 text-[rgb(var(--gold))]" />Paris 8e</div>
        <div><DoorOpen size={12} className="mx-auto mb-1 text-[rgb(var(--gold))]" />3 pièces</div>
        <div><RulerIcon size={12} className="mx-auto mb-1 text-[rgb(var(--gold))]" />95 m²</div>
      </div>
    </div>
  );
}

// ─── Location Section (map footer) ───────────────────────────────────────────
function LocationSection({ address, lat, lng, title }: { address: string; lat: number; lng: number; title: string }) {
  const POI = [
    { icon: "🚇", name: "Metro George V",    dist: "2 min à pied" },
    { icon: "🛍️", name: "Champs-Élysées",   dist: "5 min à pied" },
    { icon: "🍽️", name: "Restaurants",      dist: "Nombreux" },
    { icon: "✈️", name: "Aéroport CDG",     dist: "45 min RER" },
  ];

  return (
    <section className="bg-[rgb(var(--dark))] border-t border-[rgb(var(--gold))]/10">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 pt-10 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <p className="section-label">Où se situe le bien</p>
          <h3 className="font-['Cormorant_Garamond'] text-4xl font-light text-white mt-2">
            Localisation
          </h3>
        </div>
        <div className="text-right">
          <p className="text-sm text-white/40 flex items-center gap-1.5">
            <MapPin size={12} className="text-[rgb(var(--gold))]" />
            {address}
          </p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline-gold mt-2 text-[10px] px-4 py-1.5 inline-flex items-center gap-1.5"
          >
            <ExternalLink size={11} /> Ouvrir dans Maps
          </a>
        </div>
      </div>

      {/* Map embed */}
      <div className="relative h-[380px] overflow-hidden">
        <iframe
          src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
          className="w-full h-full border-none"
          loading="lazy"
          title={`Localisation ${title}`}
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          style={{ filter: "grayscale(20%) contrast(1.1)" }}
        />
        {/* Gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[rgb(var(--dark))]/80 to-transparent h-28 pointer-events-none flex items-end px-8 pb-4">
          <div className="inline-flex items-center gap-2.5 bg-black/65 text-white/85 text-sm px-4 py-2 rounded-full backdrop-blur-sm">
            <MapPin size={13} className="text-[rgb(var(--gold))]" />
            {address}
          </div>
        </div>
      </div>

      {/* Points of interest */}
      <div className="max-w-7xl mx-auto px-6 py-8 bg-[rgb(var(--dark-2))]/50 border-t border-[rgb(var(--gold))]/8">
        <p className="text-[10px] tracking-[0.18em] uppercase text-stone-500 mb-5">À proximité</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {POI.map((p) => (
            <div key={p.name} className="flex items-center gap-3">
              <div className="w-9 h-9 border border-[rgb(var(--gold))]/22 rounded-full flex items-center justify-center text-base flex-shrink-0">
                {p.icon}
              </div>
              <div>
                <p className="text-sm text-white/72">{p.name}</p>
                <p className="text-[11px] text-white/35">{p.dist}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

interface Props {
    id: number;
}

// ─── ApartmentDetailPage ──────────────────────────────────────────────────────
export default function ApartmentDetailPage({id}:Props) {
  
  const apartment = APARTMENTS.find((a) => a.id === Number(id)) ?? APARTMENTS[0];

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
          <span className="text-[rgb(var(--gold))]">{apartment.title}</span>
        </div>
      </div>

      {/* ── Carousel ── */}
      <ImageCarousel images={apartment.images} title={apartment.title} />

      {/* ── Detail + Booking ── */}
      <div className="max-w-7xl mx-auto w-full px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">

          {/* LEFT: description */}
          <div>
            {/* Header */}
            <p className="text-[11px] tracking-[0.08em] uppercase text-[rgb(var(--gold))] mb-1">
              📍 {apartment.location}
            </p>
            <h1 className="font-['Cormorant_Garamond'] text-5xl font-light text-[rgb(var(--dark))] mb-3">
              {apartment.title}
            </h1>
            <p className="text-stone-500 text-base mb-4">{apartment.subtitle}</p>

            {/* Rating */}
            <div className="inline-flex items-center gap-2 bg-[rgb(var(--cream-2))]/80 border border-[rgb(var(--gold))]/18 rounded-full px-4 py-2 mb-5">
              <StarRating rating={apartment.rating} reviewCount={apartment.reviewCount} />
            </div>

            {/* Pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                [DoorOpen, `${apartment.rooms} pièces`],
                [Bath, `${apartment.bathrooms} SDB`],
                [RulerIcon, `${apartment.sqm} m²`],
                [Users, `${apartment.maxGuests} pers. max`],
              ].map(([Icon, label]) => (
                <div key={String(label)} className="flex items-center gap-1.5 border border-[rgb(var(--gold))]/22 rounded-full px-3 py-1.5 text-xs">
                  {/* @ts-ignore */}
                  <Icon size={12} className="text-[rgb(var(--gold))]" />
                  {String(label)}
                </div>
              ))}
            </div>

            <div className="w-10 h-0.5 bg-[rgb(var(--gold))] mb-5" />

            {/* Description */}
            <h4 className="font-['Cormorant_Garamond'] text-2xl mb-3">Description</h4>
            <p className="text-sm text-stone-500 leading-relaxed mb-8">
              Nichée dans le prestigieux 8e arrondissement, cette suite Haussmannienne d'exception allie le charme architectural du XIXe siècle à un confort contemporain irréprochable. Hauts plafonds à moulures, parquet point de Hongrie, baies vitrées dominant l'avenue — chaque détail a été pensé pour offrir une expérience unique.
            </p>

            {/* Amenities */}
            <h4 className="font-['Cormorant_Garamond'] text-2xl mb-4">Équipements</h4>
            <div className="grid grid-cols-2 gap-x-8 mb-8">
              {apartment.amenities.map((am) => (
                <div key={am.label} className="flex items-center gap-2.5 py-2.5 border-b border-[rgb(var(--gold))]/8 text-sm">
                  <span className="text-[rgb(var(--gold))] text-base">✓</span>
                  {am.label}
                </div>
              ))}
            </div>

            {/* Rules */}
            <div className="bg-[rgb(var(--cream-2))]/60 border border-[rgb(var(--gold))]/12 rounded-xl p-5 mb-8">
              <h6 className="text-[10px] tracking-[0.14em] uppercase text-[rgb(var(--gold))] font-semibold mb-4">
                Règles du séjour
              </h6>
              <div className="grid grid-cols-2 gap-3 text-sm text-stone-500">
                {[
                  [Clock, `Check-in : dès ${apartment.checkIn}`],
                  [Clock, `Check-out : avant ${apartment.checkOut}`],
                  [Ban, "Non-fumeur"],
                  [PawPrint, "Animaux non admis"],
                ].map(([Icon, text]) => (
                  <div key={String(text)} className="flex items-center gap-2">
                    {/* @ts-ignore */}
                    <Icon size={13} className="text-[rgb(var(--gold))]" />
                    {String(text)}
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <h4 className="font-['Cormorant_Garamond'] text-2xl mb-5 flex items-center gap-2">
              <Star size={16} className="text-[rgb(var(--gold))]" />
              Avis voyageurs
              <span className="font-['DM_Sans'] text-base font-light text-stone-400">
                ({apartment.reviewCount} avis)
              </span>
            </h4>
            <div className="flex flex-col gap-4">
              {apartment.reviews.map((r) => (
                <div key={r.id} className="bg-white border border-[rgb(var(--gold))]/10 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-full bg-[rgb(var(--gold))] flex items-center justify-center font-['Cormorant_Garamond'] text-xl font-semibold text-[rgb(var(--dark))] flex-shrink-0">
                      {r.name[0]}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{r.name}</p>
                      <p className="text-xs text-stone-400">{r.date}</p>
                    </div>
                    <div className="ml-auto">
                      <StarRating rating={r.rating} showCount={false} size={11} />
                    </div>
                  </div>
                  <p className="text-sm text-stone-500 leading-relaxed">{r.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Booking box */}
          <div>
            <BookingBox
              pricePerNight={apartment.pricePerNight}
              maxGuests={apartment.maxGuests}
              aptId={apartment.id}
            />
          </div>
        </div>
      </div>

      {/* ── Map / Location (footer of page) ── */}
      <LocationSection
        address={apartment.address}
        lat={apartment.lat}
        lng={apartment.lng}
        title={apartment.title}
      />

      <Footer />
    </div>
  );
}