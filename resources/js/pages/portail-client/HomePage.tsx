"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "@inertiajs/react";
import { Search, Shield, Headphones, Star, Gem } from "lucide-react";
import { searchSchema, type SearchSchema } from "@/lib/validators";
import { APARTMENTS } from "@/lib/data";
import ApartmentCard from "@/components/shared/ApartmentCard";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// ─── Search Form ──────────────────────────────────────────────────────────────
function SearchForm() {
  const today = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SearchSchema>({
    resolver: zodResolver(searchSchema),
    defaultValues: { destination: "", checkin: "", checkout: "", guests: "", type: "" },
  });

  const checkinVal = watch("checkin");

  const onSubmit = (data: SearchSchema) => {
    const params = new URLSearchParams(data as Record<string, string>);
    router.get(`/appartements?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="bg-white rounded-xl p-7 shadow-[0_32px_80px_rgba(0,0,0,0.28)] border-t-[3px] border-[rgb(var(--gold))]"
    >
      <p className="section-label mb-1">Recherche rapide</p>
      <h4 className="font-['Cormorant_Garamond'] text-2xl mb-5">Trouvez votre séjour</h4>

      {/* Destination */}
      <div className="mb-4">
        <label className="form-label-ls">
          📍 Destination
        </label>
        <input
          {...register("destination")}
          placeholder="Paris, Abidjan, Dakar…"
          className={`input-ls ${errors.destination ? "error" : ""}`}
        />
        {errors.destination && (
          <p className="text-[11px] text-red-500 mt-1">{errors.destination.message}</p>
        )}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="form-label-ls">📅 Arrivée</label>
          <input
            {...register("checkin")}
            type="date"
            min={today}
            className={`input-ls ${errors.checkin ? "error" : ""}`}
          />
          {errors.checkin && (
            <p className="text-[11px] text-red-500 mt-1">{errors.checkin.message}</p>
          )}
        </div>
        <div>
          <label className="form-label-ls">📅 Départ</label>
          <input
            {...register("checkout")}
            type="date"
            min={checkinVal || today}
            className={`input-ls ${errors.checkout ? "error" : ""}`}
          />
          {errors.checkout && (
            <p className="text-[11px] text-red-500 mt-1">{errors.checkout.message}</p>
          )}
        </div>
      </div>

      {/* Guests + Type */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div>
          <label className="form-label-ls">👥 Voyageurs</label>
          <select
            {...register("guests")}
            className={`input-ls ${errors.guests ? "error" : ""}`}
          >
            <option value="">Sélectionner</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n} personne{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
          {errors.guests && (
            <p className="text-[11px] text-red-500 mt-1">{errors.guests.message}</p>
          )}
        </div>
        <div>
          <label className="form-label-ls">🏠 Type</label>
          <select {...register("type")} className="input-ls">
            <option value="">Tous</option>
            {["Studio", "T2", "T3", "Penthouse", "Villa"].map((t) => (
              <option key={t} value={t.toLowerCase()}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <button type="submit" className="btn-gold w-full justify-center py-3">
        <Search size={14} /> Rechercher la disponibilité
      </button>
    </form>
  );
}

// ─── Why Us cards ─────────────────────────────────────────────────────────────
const WHY_ITEMS = [
  { Icon: Gem,        title: "Sélection Premium",    desc: "Chaque appartement est rigoureusement vérifié selon nos critères d'excellence." },
  { Icon: Headphones, title: "Conciergerie 24/7",    desc: "Notre équipe dédiée est disponible à toute heure pour satisfaire chaque demande." },
  { Icon: Shield,     title: "Paiement Sécurisé",    desc: "Transactions chiffrées, annulation flexible et garantie de remboursement intégral." },
  { Icon: Star,       title: "Avis Authentiques",    desc: "100% des avis proviennent de voyageurs ayant réellement séjourné chez nous." },
];

// ─── HomePage ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const featured = APARTMENTS.slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative min-h-[90vh] flex items-center bg-[rgb(var(--dark))] overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35 transition-transform duration-[8s] hover:scale-[1.02]"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1800&q=80')" }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[rgb(var(--dark))]/90 via-[rgb(var(--dark))]/60 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-12">

            {/* Copy */}
            <div className="flex-1 max-w-xl">
              <p className="text-[11px] tracking-[0.28em] uppercase text-[rgb(var(--gold))] font-medium mb-5">
                ✦ Collection Prestige 2024
              </p>
              <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-['Cormorant_Garamond'] font-light text-white leading-[1.08] mb-5">
                L'art de vivre<br />
                <em className="text-[rgb(var(--gold))] font-light italic">autrement</em>
              </h1>
              <p className="text-base text-white/55 mb-8 leading-relaxed max-w-md">
                Des appartements d'exception, des séjours sur mesure.<br />
                Chaque espace raconte une histoire unique.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="/appartements" className="btn-gold py-3 px-8 text-xs">
                  Découvrir nos espaces
                </a>
                <a
                  href="#pourquoi"
                  className="inline-flex items-center gap-2 border border-white/25 text-white/70 text-[11px] tracking-widest uppercase px-8 py-3 rounded hover:border-white/50 hover:text-white transition-all duration-200"
                >
                  Comment ça marche
                </a>
              </div>

              {/* Stats */}
              <div className="flex gap-10 mt-10 pt-8 border-t border-[rgb(var(--gold))]/15">
                {[["240+", "Appartements"], ["18", "Destinations"], ["4.9", "Note moyenne"]].map(([num, lbl]) => (
                  <div key={lbl}>
                    <div className="font-['Cormorant_Garamond'] text-4xl text-[rgb(var(--gold))] leading-none">{num}</div>
                    <div className="text-[10px] tracking-[0.1em] uppercase text-white/40 mt-1">{lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Search card */}
            <div className="w-full lg:w-[360px] flex-shrink-0">
              <SearchForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED APARTMENTS ── */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="section-label">Nos coups de cœur</p>
            <div className="divider-gold mx-auto mt-2 mb-3" />
            <h2 className="font-['Cormorant_Garamond'] text-4xl font-light">
              Appartements <em className="text-[rgb(var(--gold))] italic">à la une</em>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((apt) => (
              <ApartmentCard key={apt.id} apartment={apt} />
            ))}
          </div>
          <div className="text-center mt-10">
            <a href="/appartements" className="btn-outline-gold">
              Voir tous les appartements →
            </a>
          </div>
        </div>
      </section>

      {/* ── WHY US ── */}
      <section id="pourquoi" className="bg-[rgb(var(--dark))] py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="section-label">Pourquoi LuxStay</p>
            <div className="divider-gold mx-auto mt-2 mb-3" />
            <h2 className="font-['Cormorant_Garamond'] text-4xl font-light text-white">
              Une expérience <em className="text-[rgb(var(--gold))] italic">sans égale</em>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_ITEMS.map(({ Icon, title, desc }) => (
              <div key={title} className="text-center px-4 py-6">
                <div className="w-14 h-14 border border-[rgb(var(--gold))]/30 rounded-full flex items-center justify-center mx-auto mb-5">
                  <Icon size={22} className="text-[rgb(var(--gold))]" />
                </div>
                <h5 className="font-['Cormorant_Garamond'] text-xl text-white mb-3">{title}</h5>
                <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}