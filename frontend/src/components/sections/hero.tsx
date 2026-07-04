"use client";

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

const AVATARS: { initials: string; gradient: string }[] = [
  { initials: "JM", gradient: "from-green-500 to-green-700" },
  { initials: "SK", gradient: "from-green-600 to-green-400" },
  { initials: "AR", gradient: "from-green-400 to-green-600" },
  { initials: "LT", gradient: "from-emerald-500 to-green-700" },
  { initials: "DP", gradient: "from-green-500 to-emerald-500" },
];

const CHECKS = ["ToS-safe by design", "No credit card", "5-minute setup"];

const CHIPS: { icon: ReactNode; label: string; position: string; delay: string }[] = [
  {
    icon: <TrendingUp className="size-3.5 text-green-300" aria-hidden />,
    label: "+12 profile views today",
    position: "left-0 top-14",
    delay: "0s",
  },
  {
    icon: <BrainCircuit className="size-3.5 text-green-300" aria-hidden />,
    label: "Voice match 92/100",
    position: "right-0 top-[38%]",
    delay: "-2.3s",
  },
  {
    icon: <MessageSquare className="size-3.5 text-green-400" aria-hidden />,
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
        className="animate-pulse-glow pointer-events-none absolute inset-y-0 left-[20%] w-px bg-gradient-to-b from-transparent via-green-500/40 to-transparent"
      />
      <div
        aria-hidden
        className="animate-pulse-glow pointer-events-none absolute inset-y-0 left-[75%] w-px bg-gradient-to-b from-transparent via-green-500/40 to-transparent [animation-delay:-2s]"
      />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-16 px-6 lg:grid-cols-2">
        {/* ------------------------------ Left ------------------------------ */}
        <div>
          <Reveal>
            <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-foreground/90">
              <Sparkles className="size-3.5 text-green-300" aria-hidden />
              Full autopilot &mdash; coming soon
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-green-400" />
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
        <div className="relative flex h-[420px] items-center justify-center sm:h-[500px] lg:h-[600px]">
          <div
            aria-hidden
            className="absolute inset-6 rounded-full bg-green-600/30 blur-[120px]"
          />

          <Reveal delay={0.3} className="relative z-[1] h-full w-full">
            <motion.div
              initial={reduce ? undefined : { scale: 1.03 }}
              animate={reduce ? undefined : { scale: 1 }}
              transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative h-full w-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/hero-cyborg.png?v=5"
                alt="AI engagement copilot"
                width={720}
                height={540}
                decoding="async"
                fetchPriority="high"
                className="h-full w-full object-contain object-center drop-shadow-[0_30px_90px_rgba(34,197,94,0.2)]"
              />
              {!reduce && (
                <motion.div
                  aria-hidden
                  animate={{ y: ["-10%", "110%"] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  className="pointer-events-none absolute inset-x-[12%] z-10 h-px bg-gradient-to-r from-transparent via-green-400/40 to-transparent"
                />
              )}
            </motion.div>
          </Reveal>

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

          {/* Live-stat card, à la the reference "Our Rate" panel */}
          <Reveal delay={0.9} className="absolute -bottom-5 right-4 z-10 sm:right-8">
            <div className="glass-deep rounded-2xl px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                Voice match
              </p>
              <p className="mt-1 font-display text-3xl font-bold text-foreground">
                98<span className="text-gradient">%</span>
              </p>
              <p className="mt-0.5 text-[10px] text-muted">across 12k+ drafted replies</p>
            </div>
          </Reveal>
        </div>
      </div>

      {/* --------------------- Giant metallic watermark ------------------- */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-4 z-0 select-none overflow-hidden sm:bottom-0"
      >
        <p className="text-metal whitespace-nowrap text-center font-display text-[19vw] font-black uppercase leading-[0.85] tracking-tighter opacity-25">
          Influence
        </p>
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
