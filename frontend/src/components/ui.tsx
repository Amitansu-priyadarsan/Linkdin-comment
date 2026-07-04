"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "@/components/fx/motion";
import { Magnetic } from "@/components/fx/magnetic";

/* ------------------------------ Headings ------------------------------ */

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: string;
  align?: "center" | "left";
}) {
  const alignCls =
    align === "center" ? "mx-auto text-center items-center" : "text-left items-start";
  return (
    <Reveal className={`flex max-w-2xl flex-col ${alignCls}`}>
      <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
        <span className="size-1.5 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" />
        {eyebrow}
      </span>
      <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-lg leading-relaxed text-muted">{subtitle}</p>
      )}
    </Reveal>
  );
}

/** Gradient-highlighted word(s) inside a headline. */
export function GradientText({ children }: { children: ReactNode }) {
  return <span className="text-gradient">{children}</span>;
}

/* ------------------------------- Buttons ------------------------------ */

export function PrimaryButton({
  href,
  children,
  className = "",
  magnetic = true,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  magnetic?: boolean;
}) {
  const btn = (
    <Link
      href={href}
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_0_32px_rgba(124,58,237,0.35)] transition-shadow duration-300 hover:shadow-[0_0_48px_rgba(124,58,237,0.55)] ${className}`}
    >
      {/* sheen sweep */}
      <span
        aria-hidden
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
      />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </Link>
  );
  return magnetic ? <Magnetic>{btn}</Magnetic> : btn;
}

export function GhostButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`glass inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold text-foreground transition-colors duration-300 hover:border-white/25 hover:bg-white/[0.08] ${className}`}
    >
      {children}
    </Link>
  );
}

/* -------------------------------- Badges ------------------------------- */

export function SoonBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-violet-300 ${className}`}
    >
      <span className="size-1 rounded-full bg-violet-400" />
      Coming soon
    </span>
  );
}

export function LiveBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 ${className}`}
    >
      <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
      Live
    </span>
  );
}

/* ------------------------------- Backdrop ------------------------------ */

/**
 * Aurora + grid ambient background for a section (or the whole page).
 * Parent must be `relative`; content should sit above with `relative z-10`.
 */
export function Backdrop({
  grid = true,
  className = "",
}: {
  grid?: boolean;
  className?: string;
}) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {grid && (
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_35%,black_20%,transparent_75%)]" />
      )}
      <div className="animate-aurora absolute -left-40 -top-40 size-[560px] rounded-full bg-violet-600/20 blur-[140px]" />
      <div className="animate-aurora absolute -right-32 top-1/4 size-[480px] rounded-full bg-cyan-500/15 blur-[140px] [animation-delay:-6s]" />
      <div className="animate-aurora absolute -bottom-48 left-1/3 size-[520px] rounded-full bg-indigo-600/15 blur-[150px] [animation-delay:-12s]" />
    </div>
  );
}
