import { useForm } from "@inertiajs/react";
import { Briefcase, CheckCircle, MapPin, Paperclip, Users } from "lucide-react";
import { useState, type FormEvent } from "react";
import CandidatureController from "@/actions/App/Http/Controllers/PortailRecrutement/CandidatureController";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

type RecrutementDetail = {
  id: number;
  poste: string;
  departement: string | null;
  lieu: string | null;
  description: string | null;
  profil_recherche: string | null;
  competences: string[] | null;
  type_contrat_propose: "cdi" | "cdd" | "stage" | null;
  nombre_postes: number;
  date_limite_candidature: string | null;
};

const TYPE_LABELS: Record<string, string> = { cdi: "CDI", cdd: "CDD", stage: "Stage" };

export default function Detail({ recrutement }: { recrutement: RecrutementDetail }) {
  const [envoyee, setEnvoyee] = useState(false);
  const { data, setData, errors, processing, post } = useForm<{
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    cv: File | null;
    lettre_motivation: File | null;
  }>({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    cv: null,
    lettre_motivation: null,
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    post(CandidatureController.store(recrutement.id).url, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        setData({ nom: "", prenom: "", email: "", telephone: "", cv: null, lettre_motivation: null });
        setEnvoyee(true);
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[rgb(var(--cream))]">
      <Navbar />

      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        <p className="text-xs text-stone-400 mb-4">
          <a href="/carrieres" className="hover:text-[rgb(var(--gold))] transition-colors">Carrières</a>
          {" › "}
          <span className="text-[rgb(var(--gold))]">{recrutement.poste}</span>
        </p>

        <div className="bg-white rounded-xl border border-[rgb(var(--gold))]/12 p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="font-['Cormorant_Garamond'] text-4xl font-light">{recrutement.poste}</h1>
            {recrutement.type_contrat_propose && (
              <span className="text-[10px] tracking-[0.1em] uppercase border border-[rgb(var(--gold))]/30 text-[rgb(var(--gold-dark))] rounded-full px-3 py-1 whitespace-nowrap">
                {TYPE_LABELS[recrutement.type_contrat_propose]}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 mb-5">
            {recrutement.departement && (
              <span className="flex items-center gap-1"><Briefcase size={13} className="text-[rgb(var(--gold))]" /> {recrutement.departement}</span>
            )}
            {recrutement.lieu && (
              <span className="flex items-center gap-1"><MapPin size={13} className="text-[rgb(var(--gold))]" /> {recrutement.lieu}</span>
            )}
            <span className="flex items-center gap-1"><Users size={13} className="text-[rgb(var(--gold))]" /> {recrutement.nombre_postes} poste{recrutement.nombre_postes > 1 ? "s" : ""}</span>
          </div>

          {recrutement.description && (
            <p className="text-sm text-stone-600 leading-relaxed mb-4 whitespace-pre-line">{recrutement.description}</p>
          )}

          {recrutement.profil_recherche && (
            <>
              <h4 className="text-[11px] tracking-[0.14em] uppercase text-[rgb(var(--gold))] font-semibold mb-2">Profil recherché</h4>
              <p className="text-sm text-stone-600 leading-relaxed mb-4 whitespace-pre-line">{recrutement.profil_recherche}</p>
            </>
          )}

          {recrutement.competences && recrutement.competences.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {recrutement.competences.map((c) => (
                <span key={c} className="text-[11px] bg-[rgb(var(--gold))]/8 text-[rgb(var(--gold-dark))] rounded-full px-2.5 py-1">{c}</span>
              ))}
            </div>
          )}

          {recrutement.date_limite_candidature && (
            <p className="text-[11px] text-stone-400 mt-4">
              Candidatures jusqu'au {new Date(recrutement.date_limite_candidature).toLocaleDateString("fr-FR")}
            </p>
          )}
        </div>

        {envoyee ? (
          <div className="bg-white rounded-xl border border-[rgb(var(--gold))]/12 p-10 text-center">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h3 className="font-['Cormorant_Garamond'] text-2xl mb-2">Candidature envoyée !</h3>
            <p className="text-stone-500 text-sm">Notre équipe RH examinera votre dossier et reviendra vers vous.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[rgb(var(--gold))]/12 p-6">
            <h3 className="font-['Cormorant_Garamond'] text-2xl flex items-center gap-2 mb-5 pb-3 border-b border-[rgb(var(--gold))]/10">
              <Paperclip size={16} className="text-[rgb(var(--gold))]" /> Postuler à cette offre
            </h3>

            <form onSubmit={onSubmit} noValidate encType="multipart/form-data">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="form-label-ls">Prénom *</label>
                  <input
                    value={data.prenom}
                    onChange={(e) => setData("prenom", e.target.value)}
                    className={cn("input-ls", errors.prenom && "error")}
                  />
                  {errors.prenom && <p className="text-[11px] text-red-500 mt-1">{errors.prenom}</p>}
                </div>
                <div>
                  <label className="form-label-ls">Nom *</label>
                  <input
                    value={data.nom}
                    onChange={(e) => setData("nom", e.target.value)}
                    className={cn("input-ls", errors.nom && "error")}
                  />
                  {errors.nom && <p className="text-[11px] text-red-500 mt-1">{errors.nom}</p>}
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label-ls">Adresse e-mail *</label>
                <input
                  value={data.email}
                  onChange={(e) => setData("email", e.target.value)}
                  type="email"
                  className={cn("input-ls", errors.email && "error")}
                />
                {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div className="mb-4">
                <label className="form-label-ls">Téléphone</label>
                <input
                  value={data.telephone}
                  onChange={(e) => setData("telephone", e.target.value)}
                  type="tel"
                  className={cn("input-ls", errors.telephone && "error")}
                />
                {errors.telephone && <p className="text-[11px] text-red-500 mt-1">{errors.telephone}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="form-label-ls">CV (PDF/Word) *</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setData("cv", e.target.files?.[0] ?? null)}
                    className={cn("input-ls", errors.cv && "error")}
                  />
                  {errors.cv && <p className="text-[11px] text-red-500 mt-1">{errors.cv}</p>}
                </div>
                <div>
                  <label className="form-label-ls">Lettre de motivation</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setData("lettre_motivation", e.target.files?.[0] ?? null)}
                    className={cn("input-ls", errors.lettre_motivation && "error")}
                  />
                  {errors.lettre_motivation && <p className="text-[11px] text-red-500 mt-1">{errors.lettre_motivation}</p>}
                </div>
              </div>

              <button type="submit" disabled={processing} className="btn-gold w-full justify-center py-3 text-sm disabled:opacity-50">
                {processing ? "Envoi en cours…" : "Envoyer ma candidature"}
              </button>
            </form>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
