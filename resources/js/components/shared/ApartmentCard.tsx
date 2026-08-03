import { Heart, Bath, DoorOpen, RulerIcon, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Link } from "@inertiajs/react";
import { cn } from "@/lib/utils";
import type { Apartment } from "@/types";

interface ApartmentCardProps {
  apartment: Apartment;
  layout?: "grid" | "list";
}

const TYPE_LABELS: Record<string, string> = {
  studio: "Studio",
  t2: "T2",
  t3: "T3",
  t4_plus: "T4+",
  penthouse: "Penthouse",
  villa: "Villa",
};

export default function ApartmentCard({
  apartment,
  layout = "grid",
}: ApartmentCardProps) {
  const [wishlisted, setWishlisted] = useState(false);

  const titre = apartment.titre ?? apartment.numero;
  const enMaintenance = apartment.statut_entretien !== "propre";

  return (
    <div className={cn("apt-card flex md:flex-col", layout === "list" && "flex-row")}>
      {/* Image */}
      <div className={cn("apt-card-img-wrap flex-shrink-0", layout === "list" && "w-56")}>
        <img
          src={apartment.photos[0]}
          alt={titre}
          className="apt-card-img"
          loading="lazy"
        />
        {enMaintenance && (
          <span className="badge-ls bg-amber-500 text-white flex items-center gap-1">
            <TriangleAlert size={10} /> Indisponible
          </span>
        )}
        {apartment.type && !enMaintenance && (
          <span className="badge-ls badge-gold">{TYPE_LABELS[apartment.type]}</span>
        )}
        {/* Wishlist */}
        <button
          onClick={() => setWishlisted((p) => !p)}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center transition-colors duration-200 hover:bg-white"
          aria-label="Favoris"
        >
          <Heart
            size={14}
            className={cn(
              "transition-colors duration-200",
              wishlisted ? "fill-red-500 text-red-500" : "text-stone-400"
            )}
          />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1">
        <div className="p-4 flex-1">
          {apartment.adresse && (
            <p className="text-[10px] tracking-[0.08em] uppercase text-[rgb(var(--gold))] mb-1">
              📍 {apartment.adresse}
            </p>
          )}
          <h3 className="font-['Cormorant_Garamond'] text-xl font-semibold text-[rgb(var(--dark))] mb-2 leading-snug">
            {titre}
          </h3>
          <div className="flex items-center gap-4 text-xs text-stone-400">
            {apartment.chambres != null && (
              <span className="flex items-center gap-1">
                <DoorOpen size={12} className="text-[rgb(var(--gold))]" />
                {apartment.chambres} pièce{apartment.chambres > 1 ? "s" : ""}
              </span>
            )}
            {apartment.salles_de_bain != null && (
              <span className="flex items-center gap-1">
                <Bath size={12} className="text-[rgb(var(--gold))]" />
                {apartment.salles_de_bain} SDB
              </span>
            )}
            {apartment.surface_m2 != null && (
              <span className="flex items-center gap-1">
                <RulerIcon size={12} className="text-[rgb(var(--gold))]" />
                {Number(apartment.surface_m2)} m²
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[rgb(var(--gold))]/10 bg-[rgb(var(--cream-2))]/50">
          <p className="font-['Cormorant_Garamond'] text-2xl text-[rgb(var(--dark))]">
            {Number(apartment.prix_nuit).toLocaleString("fr-FR")} FCFA{" "}
            <span className="font-['DM_Sans'] text-xs text-stone-400 font-light">/ nuit</span>
          </p>
          <Link href={`/appartements/${apartment.id}`} className="btn-gold text-[10px] px-4 py-2">
            Voir
          </Link>
        </div>
      </div>
    </div>
  );
}
