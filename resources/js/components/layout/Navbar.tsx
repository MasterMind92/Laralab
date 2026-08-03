import { useState } from "react";
import { Link, usePage} from "@inertiajs/react";
import { Menu, X, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Accueil",       to: "/" },
  { label: "Appartements",  to: "/appartements" },
];

export default function Navbar() {
  const { url } = usePage();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-[rgb(var(--dark))] border-b border-[rgb(var(--gold))]/10">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">

        {/* Brand */}
        <Link href="/" className="font-['Cormorant_Garamond'] text-2xl font-light text-white tracking-widest">
          Lux<span className="text-[rgb(var(--gold))]">Stay</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              href={l.to}
              className={cn(
                "text-[11px] tracking-[0.1em] uppercase px-3 py-1.5 rounded transition-colors duration-200",
                url === l.to
                  ? "text-[rgb(var(--gold))]"
                  : "text-white/55 hover:text-[rgb(var(--gold))]"
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/connexion"
            className="text-[11px] tracking-[0.12em] uppercase border border-[rgb(var(--gold))] text-[rgb(var(--gold))] px-4 py-1.5 rounded transition-all duration-200 hover:bg-[rgb(var(--gold))] hover:text-[rgb(var(--dark))] flex items-center gap-1.5"
          >
            <Lock size={11} />
            Connexion
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white/70 hover:text-white transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden bg-[rgb(var(--dark-2))] border-t border-[rgb(var(--gold))]/10 px-6 py-4 flex flex-col gap-2">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              href={l.to}
              onClick={() => setOpen(false)}
              className={cn(
                "text-[11px] tracking-[0.1em] uppercase py-2 transition-colors duration-200",
                url === l.to ? "text-[rgb(var(--gold))]" : "text-white/55"
              )}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/connexion"
            onClick={() => setOpen(false)}
            className="btn-outline-gold mt-2 w-full justify-center"
          >
            <Lock size={11} /> Connexion
          </Link>
        </div>
      )}
    </nav>
  );
}