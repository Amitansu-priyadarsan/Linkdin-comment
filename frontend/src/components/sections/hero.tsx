"use client";

import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  Check,
  MessageSquare,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import type { ReactNode } from "react";
import { Backdrop, GhostButton, PrimaryButton } from "@/components/ui";
import { Reveal, SplitWords } from "@/components/fx/motion";

const HeroOrb = dynamic(() => import("@/components/three/hero-orb"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.22),transparent_70%)] blur-2xl" />
  ),
});

const AVATARS: { initials: string; gradient: string }[] = [
  { initials: "JM", gradient: "from-violet-500 to-indigo-500" },
  { initials: "SK", gradient: "from-indigo-500 to-cyan-500" },
  { initials: "AR", gradient: "from-cyan-500 to-violet-500" },
  { initials: "LT", gradient: "from-fuchsia-500 to-indigo-500" },
  { initials: "DP", gradient: "from-violet-500 to-fuchsia-500" },
];

const CHECKS = ["ToS-safe by design", "No credit card", "5-minute setup"];

const CHIPS: { icon: ReactNode; label: string; position: string; delay: string }[] = [
  {
    icon: <TrendingUp className="size-3.5 text-cyan-300" aria-hidden />,
    label: "+12 profile views today",
    position: "left-0 top-14",
    delay: "0s",
  },
  {
    icon: <BrainCircuit className="size-3.5 text-violet-300" aria-hidden />,
    label: "Voice match 92/100",
    position: "right-0 top-[38%]",
    delay: "-2.3s",
  },
  {
    icon: <MessageSquare className="size-3.5 text-indigo-300" aria-hidden />,
    label: "3 drafts ready",
    position: "bottom-16 left-10",
    delay: "-4.6s",
  },
];

export default function Hero() {
  const reduce = useReducedMotion();

  return (
    <section
      id="home"
      className="relative flex min-h-screen items-center overflow-hidden pt-28 pb-24"
    >
      <Backdrop />

      {/* Thin animated light beams */}
      <div
        aria-hidden
        className="animate-pulse-glow pointer-events-none absolute inset-y-0 left-[20%] w-px bg-gradient-to-b from-transparent via-violet-500/40 to-transparent"
      />
      <div
        aria-hidden
        className="animate-pulse-glow pointer-events-none absolute inset-y-0 left-[75%] w-px bg-gradient-to-b from-transparent via-violet-500/40 to-transparent [animation-delay:-2s]"
      />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-16 px-6 lg:grid-cols-2">
        {/* ------------------------------ Left ------------------------------ */}
        <div>
          <Reveal>
            <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-foreground/90">
              <Sparkles className="size-3.5 text-violet-300" aria-hidden />
              Full autopilot &mdash; coming soon
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-violet-400" />
              </span>
            </span>
          </Reveal>

          <h1 className="mt-6 font-display text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            <SplitWords text="AI comments that" className="block" />
            <SplitWords
              text="get you seen."
              className="block pb-2"
              wordClassName="text-gradient"
              delay={0.35}
            />
          </h1>

          <Reveal delay={0.5}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              CommentPilot finds the posts worth engaging and drafts value-first
              replies in your voice &mdash; you approve in one click. LinkedIn
              today. Reddit &amp; X next.
            </p>
          </Reveal>

          <Reveal delay={0.65}>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <PrimaryButton href="/signup">
                Start free trial
                <ArrowRight
                  className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </PrimaryButton>
              <GhostButton href="#showcase">See it in action</GhostButton>
            </div>
          </Reveal>

          <Reveal delay={0.8}>
            <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-4">
              <div className="flex">
                {AVATARS.map((a) => (
                  <span
                    key={a.initials}
                    className={`-ml-2 flex size-9 items-center justify-center rounded-full bg-gradient-to-br ${a.gradient} text-[10px] font-semibold text-white ring-2 ring-background first:ml-0`}
                  >
                    {a.initials}
                  </span>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5">
                  {AVATARS.map((a) => (
                    <Star
                      key={a.initials}
                      className="size-4 fill-amber-300 text-amber-300"
                      aria-hidden
                    />
                  ))}
                </div>
                <p className="mt-1 text-sm text-muted">
                  Loved by 12,000+ founders &amp; operators
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
              {CHECKS.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 text-xs text-muted"
                >
                  <Check className="size-3.5 text-emerald-400" aria-hidden />
                  {item}
                </span>
              ))}
            </div>
          </Reveal>
        </div>

        {/* ------------------------------ Right ----------------------------- */}
        <div className="relative h-[420px] sm:h-[500px] lg:h-[600px]">
          <div
            aria-hidden
            className="absolute inset-16 rounded-full bg-violet-600 opacity-15 blur-[110px]"
          />
          <HeroOrb className="absolute inset-0" />

          {CHIPS.map((chip) => (
            <div
              key={chip.label}
              className={`animate-float-slow glass absolute z-10 hidden items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-foreground/90 sm:flex ${chip.position}`}
              style={{ animationDelay: chip.delay }}
            >
              {chip.icon}
              {chip.label}
            </div>
          ))}
        </div>
      </div>

      {/* --------------------------- Scroll cue --------------------------- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 1 }}
        className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2.5"
      >
        <div className="flex h-[38px] w-6 justify-center rounded-full border border-white/20 pt-1.5">
          <motion.span
            className="size-1 rounded-full bg-white/70"
            animate={reduce ? { y: 0 } : { y: [0, 12, 0] }}
            transition={
              reduce
                ? undefined
                : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
            }
          />
        </div>
        <span className="text-[10px] uppercase tracking-widest text-muted">
          Scroll
        </span>
      </motion.div>
    </section>
  );
}
