"use client";

import { ArrowRight } from "lucide-react";
import { GhostButton, PrimaryButton } from "@/components/ui";
import { Reveal } from "@/components/fx/motion";

const PARTICLES: { top: string; left: string; delay: string; dur: string; accent?: boolean; big?: boolean }[] = [
  { top: "18%", left: "12%", delay: "0s", dur: "6s" },
  { top: "68%", left: "8%", delay: "-2s", dur: "8s", accent: true },
  { top: "28%", left: "88%", delay: "-4s", dur: "7s", big: true },
  { top: "75%", left: "82%", delay: "-1s", dur: "9s" },
  { top: "12%", left: "55%", delay: "-3s", dur: "7.5s", accent: true, big: true },
  { top: "85%", left: "42%", delay: "-5s", dur: "6.5s" },
  { top: "45%", left: "94%", delay: "-2.5s", dur: "8.5s", accent: true },
];

export default function Cta() {
  return (
    <section className="relative py-28 pb-32">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 px-8 py-20 text-center sm:px-16">
          {/* Animated gradient mesh */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="animate-aurora absolute -left-32 -top-32 size-[440px] rounded-full bg-green-600/25 blur-[120px]" />
            <div className="animate-aurora absolute -bottom-40 -right-24 size-[420px] rounded-full bg-green-500/20 blur-[120px] [animation-delay:-7s]" />
            <div className="animate-aurora absolute left-1/3 top-1/2 size-[380px] rounded-full bg-green-700/20 blur-[110px] [animation-delay:-13s]" />
            <div className="absolute left-1/2 top-1/2 size-[900px] -translate-x-1/2 -translate-y-1/2 animate-[spin_40s_linear_infinite] rounded-full bg-[conic-gradient(from_0deg,transparent,rgba(34,197,94,0.5),transparent_30%,rgba(74,222,128,0.4),transparent_60%)] opacity-15" />
            <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black_10%,transparent_70%)]" />
            {PARTICLES.map((p, i) => (
              <span
                key={i}
                className={`animate-float-slow absolute rounded-full ${
                  p.big ? "size-1.5" : "size-1"
                } ${p.accent ? "bg-green-300/60" : "bg-green-400/60"}`}
                style={{
                  top: p.top,
                  left: p.left,
                  animationDelay: p.delay,
                  animationDuration: p.dur,
                }}
              />
            ))}
          </div>

          <Reveal className="relative z-10">
            <h2 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Show up every day.
              <br />
              <span className="text-gradient">Without spending every day.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted">
              Turn two hours of feed-scrolling into five minutes of
              review-and-post. Your voice, amplified.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <PrimaryButton href="/signup" className="px-9 py-4 text-base">
                Start free trial <ArrowRight className="size-4" />
              </PrimaryButton>
              <GhostButton href="/signin" className="px-9 py-4 text-base">
                Sign in
              </GhostButton>
            </div>
            <p className="mt-5 text-sm text-muted">
              5-day free trial · No credit card · Cancel anytime
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
