import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  size?: number;
  showCount?: boolean;
}

export default function StarRating({
  rating,
  reviewCount,
  size = 12,
  showCount = true,
}: StarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={cn(
            i < Math.floor(rating)
              ? "fill-[rgb(var(--gold))] text-[rgb(var(--gold))]"
              : "text-stone-300"
          )}
        />
      ))}
      <span className="text-[rgb(var(--gold))] font-semibold text-xs ml-0.5">
        {rating}
      </span>
      {showCount && reviewCount !== undefined && (
        <span className="text-stone-400 text-[11px]">({reviewCount} avis)</span>
      )}
    </div>
  );
}