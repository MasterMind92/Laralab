import { Form, Head } from "@inertiajs/react";
import { Mail } from "lucide-react";
import { email } from "@/routes/password";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function ForgotPasswordPage({ status }: { status?: string }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Head title="Mot de passe oublié" />
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md bg-white border border-[rgb(var(--gold))]/15 rounded-xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
          <h1 className="font-['Cormorant_Garamond'] text-3xl font-light mb-1">Mot de passe oublié</h1>
          <p className="text-sm text-stone-400 mb-7">
            Indiquez votre adresse e-mail, nous vous enverrons un lien de réinitialisation.
          </p>

          {status && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
              {status}
            </div>
          )}

          <Form {...email.form()} className="flex flex-col gap-4">
            {({ processing, errors }) => (
              <>
                <div>
                  <label className="form-label-ls">Adresse e-mail</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300">
                      <Mail size={15} />
                    </span>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      autoFocus
                      placeholder="votre@email.com"
                      className="input-ls pl-9"
                    />
                  </div>
                  {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
                </div>

                <button type="submit" disabled={processing} className="btn-gold w-full justify-center py-3 mt-1">
                  {processing ? "Envoi…" : "Envoyer le lien de réinitialisation"}
                </button>
              </>
            )}
          </Form>

          <p className="text-center text-sm text-stone-400 mt-5">
            <a href="/connexion" className="text-[rgb(var(--gold))] hover:underline font-medium">
              Retour à la connexion
            </a>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
