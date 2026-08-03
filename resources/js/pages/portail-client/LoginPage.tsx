"use client";

import { useState, type FormEvent } from "react";
import { useForm } from "@inertiajs/react";
import { Eye, EyeOff, Lock, Mail, UserPlus } from "lucide-react";
import { store } from "@/routes/login";
import RegisterController from "@/actions/App/Http/Controllers/PortailClient/RegisterController";
import { usePasswordStrength } from "@/hooks/usePasswordStrength";
import Navbar from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════
// LOGIN FORM
// ═══════════════════════════════════════════════════════
function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const [showPw, setShowPw] = useState(false);
  const { data, setData, errors, processing, post } = useForm({
    email: "",
    password: "",
    remember: false,
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    post(store().url);
  };

  return (
    <div>
      <h3 className="font-['Cormorant_Garamond'] text-3xl font-light mb-1">Content de vous revoir</h3>
      <p className="text-sm text-stone-400 mb-7">Connectez-vous à votre espace LuxStay</p>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {/* Email */}
        <div>
          <label className="form-label-ls">Adresse e-mail</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300">
              <Mail size={15} />
            </span>
            <input
              value={data.email}
              onChange={(e) => setData("email", e.target.value)}
              type="email"
              placeholder="votre@email.com"
              autoComplete="email"
              className={cn("input-ls pl-9", errors.email && "error")}
            />
          </div>
          {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="form-label-ls mb-0">Mot de passe</label>
            <a href="/connexion/mot-de-passe-oublie" className="text-[11px] text-[rgb(var(--gold))] hover:underline">
              Mot de passe oublié ?
            </a>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300">
              <Lock size={15} />
            </span>
            <input
              value={data.password}
              onChange={(e) => setData("password", e.target.value)}
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className={cn("input-ls pl-9 pr-10", errors.password && "error")}
            />
            <button
              type="button"
              onClick={() => setShowPw((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition-colors"
              tabIndex={-1}
              aria-label="Afficher le mot de passe"
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && <p className="text-[11px] text-red-500 mt-1">{errors.password}</p>}
        </div>

        {/* Remember */}
        <label className="flex items-center gap-2 text-sm text-stone-500 cursor-pointer">
          <input
            type="checkbox"
            checked={data.remember}
            onChange={(e) => setData("remember", e.target.checked)}
            className="accent-[rgb(var(--gold))]"
          />
          Se souvenir de moi
        </label>

        <button
          type="submit"
          disabled={processing}
          className="btn-gold w-full justify-center py-3 mt-1"
        >
          <Lock size={13} />
          {processing ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <p className="text-center text-sm text-stone-400 mt-5">
        Pas encore de compte ?{" "}
        <button onClick={onSwitch} className="text-[rgb(var(--gold))] hover:underline font-medium">
          Créer un compte
        </button>
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// REGISTER FORM
// ═══════════════════════════════════════════════════════
function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const [showPw, setShowPw]   = useState(false);
  const [showPwC, setShowPwC] = useState(false);
  const { data, setData, errors, processing, post } = useForm({
    prenom: "",
    nom: "",
    email: "",
    password: "",
    password_confirmation: "",
    terms: false,
  });

  const strength = usePasswordStrength(data.password);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    post(RegisterController.store().url);
  };

  return (
    <div>
      <h3 className="font-['Cormorant_Garamond'] text-3xl font-light mb-1">Rejoignez LuxStay</h3>
      <p className="text-sm text-stone-400 mb-7">Créez votre compte en quelques secondes</p>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label-ls">Prénom</label>
            <input
              value={data.prenom}
              onChange={(e) => setData("prenom", e.target.value)}
              placeholder="Jean"
              className={cn("input-ls", errors.prenom && "error")}
            />
            {errors.prenom && <p className="text-[11px] text-red-500 mt-1">{errors.prenom}</p>}
          </div>
          <div>
            <label className="form-label-ls">Nom</label>
            <input
              value={data.nom}
              onChange={(e) => setData("nom", e.target.value)}
              placeholder="Dupont"
              className={cn("input-ls", errors.nom && "error")}
            />
            {errors.nom && <p className="text-[11px] text-red-500 mt-1">{errors.nom}</p>}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="form-label-ls">Adresse e-mail</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300">
              <Mail size={15} />
            </span>
            <input
              value={data.email}
              onChange={(e) => setData("email", e.target.value)}
              type="email"
              placeholder="votre@email.com"
              className={cn("input-ls pl-9", errors.email && "error")}
            />
          </div>
          {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="form-label-ls">Mot de passe</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300">
              <Lock size={15} />
            </span>
            <input
              value={data.password}
              onChange={(e) => setData("password", e.target.value)}
              type={showPw ? "text" : "password"}
              placeholder="Minimum 8 caractères"
              autoComplete="new-password"
              className={cn("input-ls pl-9 pr-10", errors.password && "error")}
            />
            <button
              type="button"
              onClick={() => setShowPw((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500"
              tabIndex={-1}
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {/* Strength bar */}
          {data.password && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((seg) => (
                  <div
                    key={seg}
                    className="flex-1 h-1 rounded-sm transition-colors duration-300"
                    style={{ background: seg <= strength.level ? strength.color : "#E7E5E4" }}
                  />
                ))}
              </div>
              {strength.label && (
                <p className="text-[11px] mt-1" style={{ color: strength.color }}>
                  {strength.label}
                </p>
              )}
            </div>
          )}
          {errors.password && <p className="text-[11px] text-red-500 mt-1">{errors.password}</p>}
        </div>

        {/* Confirm password */}
        <div>
          <label className="form-label-ls">Confirmer le mot de passe</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300">
              <Lock size={15} />
            </span>
            <input
              value={data.password_confirmation}
              onChange={(e) => setData("password_confirmation", e.target.value)}
              type={showPwC ? "text" : "password"}
              placeholder="Répétez le mot de passe"
              autoComplete="new-password"
              className={cn("input-ls pl-9 pr-10", errors.password_confirmation && "error")}
            />
            <button
              type="button"
              onClick={() => setShowPwC((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500"
              tabIndex={-1}
            >
              {showPwC ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password_confirmation && (
            <p className="text-[11px] text-red-500 mt-1">{errors.password_confirmation}</p>
          )}
        </div>

        {/* Terms */}
        <div>
          <label className="flex items-start gap-2.5 text-sm text-stone-500 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={data.terms}
              onChange={(e) => setData("terms", e.target.checked)}
              className="mt-0.5 accent-[rgb(var(--gold))]"
            />
            <span>
              J'accepte les{" "}
              <a href="#" className="text-[rgb(var(--gold))] hover:underline">conditions d'utilisation</a>{" "}
              et la{" "}
              <a href="#" className="text-[rgb(var(--gold))] hover:underline">politique de confidentialité</a>
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={processing}
          className="btn-gold w-full justify-center py-3 mt-1"
        >
          <UserPlus size={13} />
          {processing ? "Création…" : "Créer mon compte"}
        </button>
      </form>

      <p className="text-center text-sm text-stone-400 mt-5">
        Déjà un compte ?{" "}
        <button onClick={onSwitch} className="text-[rgb(var(--gold))] hover:underline font-medium">
          Se connecter
        </button>
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// LoginPage — layout split écran
// ═══════════════════════════════════════════════════════
export default function LoginPage() {
  const [tab, setTab] = useState<"login" | "register">("login");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        {/* ── Visual panel ── */}
        <div className="hidden lg:flex flex-1 relative flex-col justify-end p-14 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900&q=80')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--dark))]/92 via-[rgb(var(--dark))]/65 to-transparent" />
          <div className="relative z-10">
            <p className="section-label mb-3">Bienvenue sur LuxStay</p>
            <h2 className="font-['Cormorant_Garamond'] text-5xl font-light text-white leading-snug mb-4">
              Des séjours<br />
              <em className="text-[rgb(var(--gold))] italic">d'exception</em><br />
              vous attendent
            </h2>
            <p className="text-sm text-white/45 leading-relaxed max-w-xs">
              Accédez à plus de 240 appartements de prestige dans les plus belles villes du monde.
            </p>
            {/* Decorative dots */}
            <div className="flex gap-2 mt-8">
              {[true, false, false].map((active, i) => (
                <div
                  key={i}
                  className={cn("h-0.5 rounded-sm transition-all", active ? "w-10 bg-[rgb(var(--gold))]" : "w-6 bg-white/15")}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Form panel ── */}
        <div className="w-full lg:w-[460px] flex-shrink-0 bg-[rgb(var(--cream))] flex flex-col justify-center px-10 py-12">
          <a href="/" className="font-['Cormorant_Garamond'] text-2xl text-[rgb(var(--dark))] tracking-widest mb-10 block">
            Lux<span className="text-[rgb(var(--gold))]">Stay</span>
          </a>

          {/* Tabs */}
          <div className="flex border-b-2 border-[rgb(var(--gold))]/15 mb-8">
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 text-center pb-3 text-[11px] tracking-[0.1em] uppercase font-medium border-b-2 -mb-[2px] transition-all duration-200",
                  tab === t
                    ? "text-[rgb(var(--gold))] border-[rgb(var(--gold))]"
                    : "text-stone-400 border-transparent hover:text-stone-600"
                )}
              >
                {t === "login" ? "Connexion" : "Créer un compte"}
              </button>
            ))}
          </div>

          {tab === "login"
            ? <LoginForm    onSwitch={() => setTab("register")} />
            : <RegisterForm onSwitch={() => setTab("login")} />
          }
        </div>
      </div>
    </div>
  );
}
