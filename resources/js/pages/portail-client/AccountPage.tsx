import { Head, useForm } from "@inertiajs/react";
import { type FormEvent } from "react";
import { User, MailWarning } from "lucide-react";
import ProfileController from "@/actions/App/Http/Controllers/Settings/ProfileController";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

type AccountClient = {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
};

export default function AccountPage({
  client,
  mustVerifyEmail,
  status,
}: {
  client: AccountClient;
  mustVerifyEmail: boolean;
  status?: string;
}) {
  const { data, setData, errors, processing, recentlySuccessful, patch } = useForm({
    prenom: client.prenom,
    nom: client.nom,
    email: client.email,
    telephone: client.telephone,
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    patch(ProfileController.updateClient().url, { preserveScroll: true });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Head title="Mon compte" />
      <Navbar />

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
        <h1 className="font-['Cormorant_Garamond'] text-4xl font-light mb-8">Mon compte</h1>

        <form onSubmit={onSubmit} className="bg-white border border-[rgb(var(--gold))]/12 rounded-xl p-6 space-y-4">
          <h3 className="font-['Cormorant_Garamond'] text-2xl flex items-center gap-2 mb-2 pb-3 border-b border-[rgb(var(--gold))]/10">
            <User size={16} className="text-[rgb(var(--gold))]" /> Mes informations
          </h3>

          {mustVerifyEmail && !status && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-4 py-3 text-sm">
              <MailWarning size={16} />
              Votre adresse e-mail n'est pas encore vérifiée.
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
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

          <div>
            <label className="form-label-ls">Adresse e-mail *</label>
            <input
              value={data.email}
              onChange={(e) => setData("email", e.target.value)}
              type="email"
              className={cn("input-ls", errors.email && "error")}
            />
            {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
            <p className="text-[11px] text-stone-400 mt-1">
              Changer d'adresse e-mail nécessitera une nouvelle vérification.
            </p>
          </div>

          <div>
            <label className="form-label-ls">Téléphone</label>
            <input
              value={data.telephone}
              onChange={(e) => setData("telephone", e.target.value)}
              type="tel"
              className={cn("input-ls", errors.telephone && "error")}
            />
            {errors.telephone && <p className="text-[11px] text-red-500 mt-1">{errors.telephone}</p>}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={processing} className="btn-gold py-3 px-8">
              {processing ? "Enregistrement…" : "Enregistrer"}
            </button>
            {recentlySuccessful && <span className="text-sm text-green-600">Enregistré.</span>}
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
}
