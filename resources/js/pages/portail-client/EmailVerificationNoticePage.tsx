import { Form, Head, Link } from "@inertiajs/react";
import { MailCheck } from "lucide-react";
import { logout } from "@/routes";
import { send } from "@/routes/verification";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function EmailVerificationNoticePage({ status }: { status?: string }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Head title="Vérifiez votre e-mail" />
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md bg-white border border-[rgb(var(--gold))]/15 rounded-xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.08)] text-center">
          <div className="w-14 h-14 rounded-full bg-[rgb(var(--cream-2))] flex items-center justify-center mx-auto mb-5">
            <MailCheck size={24} className="text-[rgb(var(--gold))]" />
          </div>

          <h1 className="font-['Cormorant_Garamond'] text-3xl font-light mb-2">Vérifiez votre e-mail</h1>
          <p className="text-sm text-stone-400 mb-6">
            Nous vous avons envoyé un lien de confirmation. Cliquez dessus pour activer pleinement votre compte
            LuxStay.
          </p>

          {status === "verification-link-sent" && (
            <div className="mb-5 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
              Un nouveau lien de vérification vient de vous être envoyé.
            </div>
          )}

          <Form {...send.form()}>
            {({ processing }) => (
              <button type="submit" disabled={processing} className="btn-gold w-full justify-center py-3 mb-3">
                {processing ? "Envoi…" : "Renvoyer le lien de vérification"}
              </button>
            )}
          </Form>

          <Link href={logout()} as="button" className="text-sm text-stone-400 hover:text-[rgb(var(--gold))]">
            Se déconnecter
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
