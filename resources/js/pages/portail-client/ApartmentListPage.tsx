import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SlidersHorizontal, LayoutGrid, List } from "lucide-react";
import { filterSchema, type FilterSchema } from "@/lib/validators";
import { APARTMENTS } from "@/lib/data";
import ApartmentCard from "@/components/shared/ApartmentCard";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

// ─── APT_TYPES & AMENITY OPTIONS ────────────────────────────────────────────
const APT_TYPES    = ["Studio", "T2", "T3", "T4+", "Penthouse", "Villa"];
const AMENITIES    = ["Wifi", "Parking", "Piscine", "Climatisation", "Cuisine équipée", "Vue mer"];
const SORT_OPTIONS = [
  { value: "recommended", label: "Recommandés" },
  { value: "price_asc",   label: "Prix croissant" },
  { value: "price_desc",  label: "Prix décroissant" },
  { value: "rating",      label: "Mieux notés" },
];

// ─── Filter Sidebar ───────────────────────────────────────────────────────────
function FilterSidebar({ onApply }: { onApply: (d: FilterSchema) => void }) {
  const today = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FilterSchema>({
    resolver: zodResolver(filterSchema),
    defaultValues: { destination: "", checkin: "", checkout: "", priceMin: "", priceMax: "", types: [], amenities: [] },
  });

  const checkinVal = watch("checkin");

  const onReset = () => {
    reset();
    onApply({} as FilterSchema);
  };

  return (
    <aside className="bg-white rounded-xl border border-[rgb(var(--gold))]/12 p-5 sticky top-[72px] h-fit">
      <form onSubmit={handleSubmit(onApply)} noValidate>

        {/* Destination */}
        <div className="mb-5">
          <p className="text-[10px] tracking-[0.16em] uppercase text-[rgb(var(--gold))] font-semibold mb-3 pb-2 border-b border-[rgb(var(--gold))]/12">
            🔍 Recherche
          </p>
          <input
            {...register("destination")}
            placeholder="Destination…"
            className={`input-ls ${errors.destination ? "error" : ""}`}
          />
          {errors.destination && (
            <p className="text-[11px] text-red-500 mt-1">{errors.destination.message}</p>
          )}
        </div>

        {/* Dates */}
        <div className="mb-5">
          <p className="text-[10px] tracking-[0.16em] uppercase text-[rgb(var(--gold))] font-semibold mb-3 pb-2 border-b border-[rgb(var(--gold))]/12">
            📅 Dates
          </p>
          <div className="mb-3">
            <label className="form-label-ls">Arrivée</label>
            <input {...register("checkin")} type="date" min={today} className="input-ls" />
          </div>
          <div>
            <label className="form-label-ls">Départ</label>
            <input {...register("checkout")} type="date" min={checkinVal || today} className={`input-ls ${errors.checkout ? "error" : ""}`} />
            {errors.checkout && (
              <p className="text-[11px] text-red-500 mt-1">{errors.checkout.message}</p>
            )}
          </div>
        </div>

        {/* Budget */}
        <div className="mb-5">
          <p className="text-[10px] tracking-[0.16em] uppercase text-[rgb(var(--gold))] font-semibold mb-3 pb-2 border-b border-[rgb(var(--gold))]/12">
            💰 Budget / nuit
          </p>
          <div className="grid grid-cols-2 gap-2">
            <input {...register("priceMin")} type="number" placeholder="Min €" min="0" className="input-ls" />
            <input
              {...register("priceMax")}
              type="number"
              placeholder="Max €"
              min="0"
              className={`input-ls ${errors.priceMax ? "error" : ""}`}
            />
          </div>
          {errors.priceMax && (
            <p className="text-[11px] text-red-500 mt-1">{errors.priceMax.message}</p>
          )}
        </div>

        {/* Type */}
        <div className="mb-5">
          <p className="text-[10px] tracking-[0.16em] uppercase text-[rgb(var(--gold))] font-semibold mb-3 pb-2 border-b border-[rgb(var(--gold))]/12">
            🏠 Type
          </p>
          <div className="flex flex-col gap-2">
            {APT_TYPES.map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  value={t.toLowerCase()}
                  {...register("types")}
                  className="accent-[rgb(var(--gold))]"
                />
                {t}
              </label>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div className="mb-6">
          <p className="text-[10px] tracking-[0.16em] uppercase text-[rgb(var(--gold))] font-semibold mb-3 pb-2 border-b border-[rgb(var(--gold))]/12">
            ⚙️ Équipements
          </p>
          <div className="flex flex-col gap-2">
            {AMENITIES.map((a) => (
              <label key={a} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  value={a.toLowerCase()}
                  {...register("amenities")}
                  className="accent-[rgb(var(--gold))]"
                />
                {a}
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-gold w-full justify-center mb-2">
          <SlidersHorizontal size={13} /> Appliquer
        </button>
        <button type="button" onClick={onReset} className="w-full text-center text-xs text-stone-400 hover:text-[rgb(var(--gold))] transition-colors py-1">
          Réinitialiser
        </button>
      </form>
    </aside>
  );
}

// ─── ApartmentListPage ────────────────────────────────────────────────────────
export default function ApartmentListPage() {
  const [sort, setSort] = useState("recommended");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_filters, setFilters] = useState<FilterSchema | null>(null);

  const sorted = [...APARTMENTS].sort((a, b) => {
    if (sort === "price_asc")  return a.pricePerNight - b.pricePerNight;
    if (sort === "price_desc") return b.pricePerNight - a.pricePerNight;
    if (sort === "rating")     return b.rating - a.rating;
    return 0;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Page header */}
      <div className="bg-[rgb(var(--dark))] px-6 py-10 border-b border-[rgb(var(--gold))]/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 flex items-center pointer-events-none select-none">
          <span className="font-['Cormorant_Garamond'] text-[8rem] font-bold text-[rgb(var(--gold))]/5 tracking-widest">
            APPARTEMENTS
          </span>
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <p className="text-xs text-white/30 mb-2">
            <a href="/" className="hover:text-white/50 transition-colors">Accueil</a>
            {" › "}
            <span className="text-[rgb(var(--gold))]">Appartements</span>
          </p>
          <h1 className="font-['Cormorant_Garamond'] text-5xl font-light text-white">
            Nos <em className="text-[rgb(var(--gold))] italic">appartements</em>
          </h1>
          <p className="text-sm text-white/40 mt-2">Découvrez notre sélection de {APARTMENTS.length}+ appartements de prestige</p>
        </div>
      </div>

      {/* Layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <div className="flex gap-7">

          {/* Sidebar */}
          <div className="hidden lg:block w-[260px] flex-shrink-0">
            <FilterSidebar onApply={setFilters} />
          </div>

          {/* Listings */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[rgb(var(--gold))]/12">
              <p className="text-sm text-stone-500">
                <strong className="text-[rgb(var(--dark))]">{sorted.length}</strong> appartements trouvés
              </p>
              <div className="flex items-center gap-3">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="input-ls w-auto py-1.5 text-xs"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <div className="flex border border-stone-200 rounded overflow-hidden">
                  <button
                    onClick={() => setLayout("grid")}
                    className={cn("p-2 transition-colors", layout === "grid" ? "bg-[rgb(var(--gold))] text-[rgb(var(--dark))]" : "text-stone-400 hover:text-stone-600")}
                    title="Grille"
                  >
                    <LayoutGrid size={15} />
                  </button>
                  <button
                    onClick={() => setLayout("list")}
                    className={cn("p-2 transition-colors", layout === "list" ? "bg-[rgb(var(--gold))] text-[rgb(var(--dark))]" : "text-stone-400 hover:text-stone-600")}
                    title="Liste"
                  >
                    <List size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* Grid / List */}
            <div className={cn(
              layout === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                : "flex flex-col gap-4"
            )}>
              {sorted.map((apt) => (
                <ApartmentCard key={apt.id} apartment={apt} layout={layout} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-10">
              {[1, 2, 3, 4, 5].map((p) => (
                <button
                  key={p}
                  className={cn(
                    "w-9 h-9 text-xs rounded border transition-all duration-200",
                    p === 1
                      ? "bg-[rgb(var(--gold))] border-[rgb(var(--gold))] text-[rgb(var(--dark))] font-medium"
                      : "border-stone-200 text-stone-500 hover:border-[rgb(var(--gold))] hover:text-[rgb(var(--gold))]"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}