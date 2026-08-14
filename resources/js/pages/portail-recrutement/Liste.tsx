import { Link } from "@inertiajs/react";
import { Briefcase, MapPin, Users } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

type RecrutementResume = {
  id: number;
  poste: string;
  departement: string | null;
  lieu: string | null;
  type_contrat_propose: "cdi" | "cdd" | "stage" | null;
  nombre_postes: number;
  date_limite_candidature: string | null;
};

const TYPE_LABELS: Record<string, string> = { cdi: "CDI", cdd: "CDD", stage: "Stage" };

export default function Liste({ recrutements }: { recrutements: RecrutementResume[] }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="bg-[rgb(var(--dark))] px-6 py-10 border-b border-[rgb(var(--gold))]/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 flex items-center pointer-events-none select-none">
          <span className="font-['Cormorant_Garamond'] text-[8rem] font-bold text-[rgb(var(--gold))]/5 tracking-widest">
            CARRIÈRES
          </span>
        </div>
        <div className="max-w-5xl mx-auto relative z-10">
          <p className="text-xs text-white/30 mb-2">
            <a href="/" className="hover:text-white/50 transition-colors">Accueil</a>
            {" › "}
            <span className="text-[rgb(var(--gold))]">Carrières</span>
          </p>
          <h1 className="font-['Cormorant_Garamond'] text-5xl font-light text-white">
            Rejoignez <em className="text-[rgb(var(--gold))] italic">notre équipe</em>
          </h1>
          <p className="text-sm text-white/40 mt-2">
            {recrutements.length} offre{recrutements.length > 1 ? "s" : ""} ouverte{recrutements.length > 1 ? "s" : ""} actuellement
          </p>
        </div>
      </div>

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        {recrutements.length > 0 ? (
          <div className="flex flex-col gap-4">
            {recrutements.map((r) => (
              <Link
                key={r.id}
                href={`/carrieres/${r.id}`}
                className="bg-white rounded-xl border border-[rgb(var(--gold))]/12 p-6 hover:border-[rgb(var(--gold))]/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-['Cormorant_Garamond'] text-2xl mb-1">{r.poste}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
                      {r.departement && (
                        <span className="flex items-center gap-1"><Briefcase size={12} className="text-[rgb(var(--gold))]" /> {r.departement}</span>
                      )}
                      {r.lieu && (
                        <span className="flex items-center gap-1"><MapPin size={12} className="text-[rgb(var(--gold))]" /> {r.lieu}</span>
                      )}
                      <span className="flex items-center gap-1"><Users size={12} className="text-[rgb(var(--gold))]" /> {r.nombre_postes} poste{r.nombre_postes > 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  {r.type_contrat_propose && (
                    <span className="text-[10px] tracking-[0.1em] uppercase border border-[rgb(var(--gold))]/30 text-[rgb(var(--gold-dark))] rounded-full px-3 py-1">
                      {TYPE_LABELS[r.type_contrat_propose]}
                    </span>
                  )}
                </div>
                {r.date_limite_candidature && (
                  <p className="text-[11px] text-stone-400 mt-3">
                    Candidatures jusqu'au {new Date(r.date_limite_candidature).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-stone-400 py-16">Aucune offre ouverte pour le moment. Revenez bientôt !</p>
        )}
      </div>

      <Footer />
    </div>
  );
}
