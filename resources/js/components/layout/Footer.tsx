import { Link } from "@inertiajs/react";
import { Instagram, Facebook, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[rgb(var(--dark))] border-t border-[rgb(var(--gold))]/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="md:col-span-1">
            <div className="font-['Cormorant_Garamond'] text-3xl font-light text-white tracking-widest mb-4">
              Lux<span className="text-[rgb(var(--gold))]">Stay</span>
            </div>
            <p className="text-sm text-white/40 leading-relaxed max-w-xs">
              Des appartements d'exception soigneusement sélectionnés pour offrir une expérience de séjour inoubliable.
            </p>
            <div className="flex gap-2 mt-5">
              {[Instagram, Facebook, Twitter, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 border border-[rgb(var(--gold))]/25 rounded-full flex items-center justify-center text-white/40 transition-all duration-200 hover:bg-[rgb(var(--gold))] hover:border-[rgb(var(--gold))] hover:text-[rgb(var(--dark))]"
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h6 className="text-[10px] tracking-[0.18em] uppercase text-[rgb(var(--gold))] font-semibold font-['DM_Sans'] mb-4">
              Navigation
            </h6>
            {["Accueil", "Appartements", "Destinations", "Offres spéciales"].map((l) => (
              <Link
                key={l}
                href="#"
                className="block text-sm text-white/40 mb-2.5 hover:text-[rgb(var(--gold))] transition-colors duration-200"
              >
                {l}
              </Link>
            ))}
          </div>

          {/* Services */}
          <div>
            <h6 className="text-[10px] tracking-[0.18em] uppercase text-[rgb(var(--gold))] font-semibold font-['DM_Sans'] mb-4">
              Services
            </h6>
            {["Conciergerie", "Transfert aéroport", "Guide de voyage", "Support 24/7"].map((s) => (
              <a
                key={s}
                href="#"
                className="block text-sm text-white/40 mb-2.5 hover:text-[rgb(var(--gold))] transition-colors duration-200"
              >
                {s}
              </a>
            ))}
          </div>

          {/* Newsletter */}
          <div>
            <h6 className="text-[10px] tracking-[0.18em] uppercase text-[rgb(var(--gold))] font-semibold font-['DM_Sans'] mb-4">
              Newsletter
            </h6>
            <p className="text-sm text-white/40 leading-relaxed mb-4">
              Recevez nos offres exclusives directement dans votre boîte mail.
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="votre@email.com"
                className="flex-1 px-3 py-2 text-sm bg-white/5 border border-[rgb(var(--gold))]/20 border-r-0 rounded-l text-white placeholder:text-white/25 outline-none focus:border-[rgb(var(--gold))]/50"
              />
              <button className="px-4 py-2 bg-[rgb(var(--gold))] text-[rgb(var(--dark))] text-xs tracking-widest uppercase font-medium rounded-r hover:bg-[rgb(var(--gold-dark))] transition-colors">
                OK
              </button>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-white/25">
            © {new Date().getFullYear()} LuxStay. Tous droits réservés.
          </p>
          <div className="flex gap-5">
            {["Confidentialité", "CGU", "Mentions légales"].map((l) => (
              <a key={l} href="#" className="text-xs text-white/25 hover:text-[rgb(var(--gold))] transition-colors">
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}