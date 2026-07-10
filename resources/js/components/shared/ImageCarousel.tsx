import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageCarouselProps {
  images: string[];
  title: string;
}

export default function ImageCarousel({ images, title }: ImageCarouselProps) {
  const [current, setCurrent] = useState(0);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % images.length);
  }, [images.length]);

  const goTo = (i: number) => setCurrent(i);

  return (
    <div>
      {/* ── Main slide ── */}
      <div className="relative bg-[rgb(var(--dark))] h-[480px] overflow-hidden">
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`${title} — photo ${i + 1}`}
            loading={i === 0 ? "eager" : "lazy"}
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
              i === current ? "opacity-90" : "opacity-0 pointer-events-none"
            )}
          />
        ))}

        {/* Prev */}
        <button
          onClick={prev}
          aria-label="Photo précédente"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-white/90 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:bg-[rgb(var(--gold))] hover:scale-105"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Next */}
        <button
          onClick={next}
          aria-label="Photo suivante"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-white/90 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:bg-[rgb(var(--gold))] hover:scale-105"
        >
          <ChevronRight size={18} />
        </button>

        {/* Counter */}
        <div className="absolute bottom-4 right-5 z-10 bg-black/55 text-white/85 text-[11px] tracking-wider px-3 py-1 rounded-full backdrop-blur-sm">
          {current + 1} / {images.length}
        </div>
      </div>

      {/* ── Thumbnail strip ── */}
      <div className="bg-[rgb(var(--dark-2))] border-b border-[rgb(var(--gold))]/10 px-8 py-2.5">
        <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-[rgb(var(--gold))]">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                "flex-shrink-0 w-[90px] h-[60px] rounded overflow-hidden border-2 transition-all duration-200",
                i === current
                  ? "border-[rgb(var(--gold))] opacity-100"
                  : "border-transparent opacity-50 hover:opacity-80"
              )}
            >
              <img
                src={src}
                alt={`Miniature ${i + 1}`}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}