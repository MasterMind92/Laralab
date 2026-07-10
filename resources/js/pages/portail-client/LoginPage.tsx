"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { router } from "@inertiajs/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, UserPlus } from "lucide-react";
import { loginSchema, registerSchema, type LoginSchema, type RegisterSchema } from "@/lib/validators";
import { usePasswordStrength } from "@/hooks/usePasswordStrength";
import Navbar from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════
// LOGIN FORM
// ═══════════════════════════════════════════════════════
  function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const [showPw, setShowPw] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const onSubmit = async (_data: LoginSchema) => {
    // Simulate async API call
    await new Promise((r) => setTimeout(r, 800));
    setSuccess(true);
    setTimeout(() => router.get("/"), 1200);
  };

  return (
    <div>
      <h3 className="font-['Cormorant_Garamond'] text-3xl font-light mb-1">Content de vous revoir</h3>
      <p className="text-sm text-stone-400 mb-7">Connectez-vous à votre espace LuxStay</p>

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          ✓ Connexion réussie ! Redirection…
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        {/* Email */}
        <div>
          <label className="form-label-ls">Adresse e-mail</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 text-sm">✉️</span>
            <input
              {...register("email")}
              type="email"
              placeholder="votre@email.com"
              autoComplete="email"
              className={cn("input-ls pl-9", errors.email && "error")}
            />
          </div>
          {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="form-label-ls mb-0">Mot de passe</label>
            <a href="/mot-de-passe-oublie" className="text-[11px] text-[rgb(var(--gold))] hover:underline">
              Mot de passe oublié ?
            </a>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 text-sm">🔒</span>
            <input
              {...register("password")}
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
          {errors.password && <p className="text-[11px] text-red-500 mt-1">{errors.password.message}</p>}
        </div>

        {/* Remember */}
        <label className="flex items-center gap-2 text-sm text-stone-500 cursor-pointer">
          <input type="checkbox" {...register("remember")} className="accent-[rgb(var(--gold))]" />
          Se souvenir de moi
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-gold w-full justify-center py-3 mt-1"
        >
          <Lock size={13} />
          {isSubmitting ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-[rgb(var(--gold))]/15" />
        <span className="text-[11px] text-stone-400 uppercase tracking-wider">ou</span>
        <div className="flex-1 h-px bg-[rgb(var(--gold))]/15" />
      </div>

      {/* OAuth */}
      {[
        { emoji: "🔵", label: "Continuer avec Google" },
        { emoji: "🔷", label: "Continuer avec Facebook" },
      ].map((s) => (
        <button
          key={s.label}
          type="button"
          className="w-full flex items-center justify-center gap-2.5 border border-stone-200 rounded-lg px-4 py-2.5 text-sm mb-2.5 hover:border-[rgb(var(--gold))] transition-colors bg-white"
        >
          <span>{s.emoji}</span> {s.label}
        </button>
      ))}

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
  const [success, setSuccess]  = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstname: "", lastname: "", email: "", password: "", confirmPassword: "", terms: false },
  });

  const pwVal = watch("password");
  const strength = usePasswordStrength(pwVal);

  const onSubmit = async (_data: RegisterSchema) => {
    await new Promise((r) => setTimeout(r, 900));
    setSuccess(true);
    setTimeout(() => router.get("/"), 1400);
  };

  return (
    <div>
      <h3 className="font-['Cormorant_Garamond'] text-3xl font-light mb-1">Rejoignez LuxStay</h3>
      <p className="text-sm text-stone-400 mb-7">Créez votre compte en quelques secondes</p>

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
          ✓ Compte créé avec succès ! Redirection…
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label-ls">Prénom</label>
            <input
              {...register("firstname")}
              placeholder="Jean"
              className={cn("input-ls", errors.firstname && "error")}
            />
            {errors.firstname && <p className="text-[11px] text-red-500 mt-1">{errors.firstname.message}</p>}
          </div>
          <div>
            <label className="form-label-ls">Nom</label>
            <input
              {...register("lastname")}
              placeholder="Dupont"
              className={cn("input-ls", errors.lastname && "error")}
            />
            {errors.lastname && <p className="text-[11px] text-red-500 mt-1">{errors.lastname.message}</p>}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="form-label-ls">Adresse e-mail</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300">✉️</span>
            <input
              {...register("email")}
              type="email"
              placeholder="votre@email.com"
              className={cn("input-ls pl-9", errors.email && "error")}
            />
          </div>
          {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="form-label-ls">Mot de passe</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300">🔒</span>
            <input
              {...register("password")}
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
          {pwVal && (
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
          {errors.password && <p className="text-[11px] text-red-500 mt-1">{errors.password.message}</p>}
        </div>

        {/* Confirm password */}
        <div>
          <label className="form-label-ls">Confirmer le mot de passe</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300">🔒</span>
            <input
              {...register("confirmPassword")}
              type={showPwC ? "text" : "password"}
              placeholder="Répétez le mot de passe"
              autoComplete="new-password"
              className={cn("input-ls pl-9 pr-10", errors.confirmPassword && "error")}
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
          {errors.confirmPassword && <p className="text-[11px] text-red-500 mt-1">{errors.confirmPassword.message}</p>}
        </div>

        {/* Terms */}
        <div>
          <label className="flex items-start gap-2.5 text-sm text-stone-500 cursor-pointer">
            <input
              type="checkbox"
              {...register("terms")}
              className="mt-0.5 accent-[rgb(var(--gold))]"
            />
            <span>
              J'accepte les{" "}
              <a href="#" className="text-[rgb(var(--gold))] hover:underline">conditions d'utilisation</a>{" "}
              et la{" "}
              <a href="#" className="text-[rgb(var(--gold))] hover:underline">politique de confidentialité</a>
            </span>
          </label>
          {errors.terms && <p className="text-[11px] text-red-500 mt-1">{errors.terms.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-gold w-full justify-center py-3 mt-1"
        >
          <UserPlus size={13} />
          {isSubmitting ? "Création…" : "Créer mon compte"}
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