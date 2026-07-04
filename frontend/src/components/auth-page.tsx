"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BRAND, Logo } from "@/components/brand";
import { Backdrop } from "@/components/ui";
import { EASE } from "@/components/fx/motion";

type Mode = "signin" | "signup";

const COPY: Record<
  Mode,
  {
    title: string;
    subtitle: string;
    cta: string;
    busy: string;
    switchText: string;
    switchCta: string;
    switchHref: string;
  }
> = {
  signin: {
    title: "Welcome back",
    subtitle: "Sign in to your dashboard and pick up where you left off.",
    cta: "Sign in",
    busy: "Signing in…",
    switchText: "Don't have an account?",
    switchCta: "Start free trial",
    switchHref: "/signup",
  },
  signup: {
    title: "Create your account",
    subtitle: "Start your 5-day free trial. No credit card required.",
    cta: "Create account →",
    busy: "Creating account…",
    switchText: "Already have an account?",
    switchCta: "Sign in",
    switchHref: "/signin",
  },
};

export function AuthPage({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const copy = COPY[mode];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    // Auth isn't wired to the backend yet — go straight to the dashboard.
    setTimeout(() => router.push("/dashboard"), 600);
  }

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground antialiased">
      {/* Left: form */}
      <div className="relative flex w-full flex-col overflow-hidden px-6 py-8 lg:w-1/2 lg:px-16">
        <Backdrop grid={false} className="opacity-60" />
        <div className="relative z-10 flex flex-1 flex-col">
          <Logo />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12"
          >
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
              {copy.title}
            </h1>
            <p className="mt-2 text-[15px] text-muted">{copy.subtitle}</p>

            <div className="mt-8 grid gap-3">
              <OAuthButton label="Continue with Google" icon={<GoogleIcon />} />
              <OAuthButton
                label="Continue with LinkedIn"
                icon={
                  <span className="flex size-5 items-center justify-center rounded bg-[#0A66C2] text-[11px] font-bold text-white">
                    in
                  </span>
                }
              />
            </div>

            <div className="my-7 flex items-center gap-4 text-xs font-medium uppercase tracking-wider text-muted">
              <span className="h-px flex-1 bg-white/10" />
              or with email
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4">
              {mode === "signup" && (
                <Field
                  id="name"
                  label="Full name"
                  type="text"
                  placeholder="Priya Sharma"
                  autoComplete="name"
                />
              )}
              <Field
                id="email"
                label="Work email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
              />
              <Field
                id="password"
                label="Password"
                type="password"
                placeholder={mode === "signup" ? "8+ characters" : "••••••••"}
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                labelExtra={
                  mode === "signin" ? (
                    <a
                      href="#"
                      className="text-xs font-medium text-green-300 transition-colors hover:text-green-200"
                    >
                      Forgot password?
                    </a>
                  ) : undefined
                }
              />
              <button
                type="submit"
                disabled={busy}
                className="mt-2 rounded-xl bg-gradient-to-r from-green-600 via-green-500 to-green-400 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_32px_rgba(34,197,94,0.35)] transition-all duration-300 hover:shadow-[0_0_48px_rgba(34,197,94,0.5)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? copy.busy : copy.cta}
              </button>
            </form>

            {mode === "signup" && (
              <p className="mt-4 text-xs leading-relaxed text-zinc-500">
                By creating an account you agree to our{" "}
                <a href="#" className="underline transition-colors hover:text-zinc-300">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="underline transition-colors hover:text-zinc-300">
                  Privacy Policy
                </a>
                .
              </p>
            )}

            <p className="mt-8 text-center text-sm text-muted">
              {copy.switchText}{" "}
              <Link
                href={copy.switchHref}
                className="font-semibold text-green-300 transition-colors hover:text-green-200"
              >
                {copy.switchCta}
              </Link>
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right: brand panel */}
      <div className="relative hidden overflow-hidden bg-[#0a0a12] lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:px-16">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="animate-aurora absolute -left-24 -top-24 size-[460px] rounded-full bg-green-600/25 blur-[130px]" />
          <div className="animate-aurora absolute -bottom-32 -right-16 size-[420px] rounded-full bg-green-500/15 blur-[130px] [animation-delay:-8s]" />
          <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,black_15%,transparent_75%)]" />
        </div>

        <div className="relative z-10">
          <blockquote className="max-w-md">
            <p className="font-display text-2xl font-semibold leading-snug text-foreground">
              “I went from invisible to 40+ profile views a day. Fifteen minutes
              of reviewing drafts replaced two hours of scrolling.”
            </p>
            <footer className="mt-6 flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-400 text-sm font-bold text-white">
                MK
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Maya K.</p>
                <p className="text-sm text-muted">Founder, B2B SaaS</p>
              </div>
            </footer>
          </blockquote>

          <div className="mt-12 grid max-w-md grid-cols-3 gap-4">
            {[
              ["3–5×", "profile views"],
              ["100+", "comments/week"],
              ["5 min", "daily review"],
            ].map(([v, l]) => (
              <div key={l} className="glass rounded-xl px-4 py-3 text-center">
                <p className="font-display text-xl font-bold text-foreground">{v}</p>
                <p className="text-xs text-muted">{l}</p>
              </div>
            ))}
          </div>

          <p className="mt-12 max-w-md text-sm text-muted">
            {BRAND} — AI comments in your voice, on LinkedIn today. Reddit &
            X coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  labelExtra,
  ...input
}: {
  id: string;
  label: string;
  labelExtra?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-zinc-300">
          {label}
        </label>
        {labelExtra}
      </div>
      <input
        id={id}
        name={id}
        required
        {...input}
        className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-foreground outline-none transition placeholder:text-zinc-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
      />
    </div>
  );
}

function OAuthButton({
  label,
  icon,
}: {
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="glass flex items-center justify-center gap-3 rounded-xl px-5 py-2.5 text-sm font-semibold text-foreground transition-colors duration-300 hover:bg-white/[0.08]"
    >
      {icon}
      {label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.1 3.7-8.6z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-5.9-2.1-6.9-5l-3.9 3C3.2 21.3 7.3 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.1 14.4c-.3-.8-.4-1.6-.4-2.4s.2-1.6.4-2.4l-3.9-3C.4 8.2 0 10 0 12s.4 3.8 1.2 5.4l3.9-3z"
      />
      <path
        fill="#EA4335"
        d="M12 4.6c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1 15.2 0 12 0 7.3 0 3.2 2.7 1.2 6.6l3.9 3c1-2.9 3.7-5 6.9-5z"
      />
    </svg>
  );
}
