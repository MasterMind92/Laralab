import { Heart, Bath, DoorOpen, RulerIcon, Star } from "lucide-react";
import { useState } from "react";
import { Link } from "@inertiajs/react";
import { cn } from "@/lib/utils";
import type { Apartment } from "@/types";

interface ApartmentCardProps {
  apartment: Apartment;
  layout?: "grid" | "list";
}

const BADGE_CLASS: Record<string, string> = {
  gold:  "badge-gold",
  blue:  "badge-blue",
  green: "badge-green",
};

export default function ApartmentCard({
  apartment,
  layout = "grid",
}: ApartmentCardProps) {
  const [wishlisted, setWishlisted] = useState(false);

  const badgeClass = BADGE_CLASS[apartment.badgeVariant ?? "gold"];

  return (
    <div className={cn("apt-card flex md:flex-col", layout === "list" && "flex-row")}>
      {/* Image */}
      <div className={cn("apt-card-img-wrap flex-shrink-0", layout === "list" && "w-56")}>
        <img
          src={apartment.images[0]}
          alt={apartment.title}
          className="apt-card-img"
          loading="lazy"
        />
        {/* Badge */}
        {apartment.badge && (
          <span className={cn("badge-ls", badgeClass)}>{apartment.badge}</span>
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
          <p className="text-[10px] tracking-[0.08em] uppercase text-[rgb(var(--gold))] mb-1">
            📍 {apartment.location}
          </p>
          <h3 className="font-['Cormorant_Garamond'] text-xl font-semibold text-[rgb(var(--dark))] mb-2 leading-snug">
            {apartment.title}
          </h3>
          <div className="flex items-center gap-4 text-xs text-stone-400">
            <span className="flex items-center gap-1">
              <DoorOpen size={12} className="text-[rgb(var(--gold))]" />
              {apartment.rooms} pièces
            </span>
            <span className="flex items-center gap-1">
              <Bath size={12} className="text-[rgb(var(--gold))]" />
              {apartment.bathrooms} SDB
            </span>
            <span className="flex items-center gap-1">
              <RulerIcon size={12} className="text-[rgb(var(--gold))]" />
              {apartment.sqm} m²
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[rgb(var(--gold))]/10 bg-[rgb(var(--cream-2))]/50">
          <div>
            <p className="font-['Cormorant_Garamond'] text-2xl text-[rgb(var(--dark))]">
              {apartment.pricePerNight}€{" "}
              <span className="font-['DM_Sans'] text-xs text-stone-400 font-light">/ nuit</span>
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={10}
                  className={cn(
                    i < Math.floor(apartment.rating)
                      ? "fill-[rgb(var(--gold))] text-[rgb(var(--gold))]"
                      : "text-stone-300"
                  )}
                />
              ))}
              <span className="text-[10px] text-stone-400 ml-1">
                ({apartment.reviewCount})
              </span>
            </div>
          </div>
          <Link href={`/appartements/${apartment.id}`} className="btn-gold text-[10px] px-4 py-2">
            Voir
          </Link>
        </div>
      </div>
    </div>
  );
}