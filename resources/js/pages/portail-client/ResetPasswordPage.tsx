import { Form, Head } from "@inertiajs/react";
import { Lock } from "lucide-react";
import { update } from "@/routes/password";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

type Props = {
  token: string;
  email: string;
  passwordRules: string;
};

export default function ResetPasswordPage({ token, email, passwordRules }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <Head title="Réinitialiser le mot de passe" />
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md bg-white border border-[rgb(var(--gold))]/15 rounded-xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
          <h1 className="font-['Cormorant_Garamond'] text-3xl font-light mb-1">Nouveau mot de passe</h1>
          <p className="text-sm text-stone-400 mb-7">Choisissez un nouveau mot de passe pour votre compte.</p>

          <Form
            {...update.form()}
            transform={(data) => ({ ...data, token, email })}
            resetOnSuccess={["password", "password_confirmation"]}
            className="flex flex-col gap-4"
          >
            {({ processing, errors }) => (
              <>
                <div>
                  <label className="form-label-ls">Adresse e-mail</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    readOnly
                    className="input-ls bg-stone-50"
                  />
                  {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="form-label-ls">Nouveau mot de passe</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300">
                      <Lock size={15} />
                    </span>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      autoFocus
                      placeholder="••••••••"
                      passwordrules={passwordRules}
                      className="input-ls pl-9"
                    />
                  </div>
                  {errors.password && <p className="text-[11px] text-red-500 mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="form-label-ls">Confirmer le mot de passe</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300">
                      <Lock size={15} />
                    </span>
                    <input
                      id="password_confirmation"
                      name="password_confirmation"
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      passwordrules={passwordRules}
                      className="input-ls pl-9"
                    />
                  </div>
                  {errors.password_confirmation && (
                    <p className="text-[11px] text-red-500 mt-1">{errors.password_confirmation}</p>
                  )}
                </div>

                <button type="submit" disabled={processing} className="btn-gold w-full justify-center py-3 mt-1">
                  {processing ? "Réinitialisation…" : "Réinitialiser le mot de passe"}
                </button>
              </>
            )}
          </Form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
