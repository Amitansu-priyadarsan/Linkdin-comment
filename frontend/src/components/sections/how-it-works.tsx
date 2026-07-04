"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
} from "framer-motion";
import {
  Download,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { SectionHeading, GradientText, SoonBadge } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/fx/motion";

type Step = {
  num: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  soon?: boolean;
};

const STEPS: Step[] = [
  {
    num: "01",
    title: "Connect",
    desc: "Add the Chrome extension and sign in. It runs quietly alongside LinkedIn in your own browser.",
    icon: Download,
  },
  {
    num: "02",
    title: "Configure",
    desc: "Train your voice from past posts and pick the topics, roles and keywords you care about.",
    icon: SlidersHorizontal,
  },
  {
    num: "03",
    title: "Automate",
    desc: "The agent scores your feed and drafts replies; you approve in one click. Full autopilot",
    icon: Sparkles,
    soon: true,
  },
  {
    num: "04",
    title: "Scale",
    desc: "Watch profile views compound. Analytics, Reddit & X agents land here soon.",
    icon: TrendingUp,
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.75", "end 0.35"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    mass: 0.4,
  });

  return (
    <section id="how-it-works" ref={sectionRef} className="relative py-28">
      <div className="mx-auto w-full max-w-6xl px-6">
        <SectionHeading
          eyebrow="How it works"
          title={
            <>
              From install to influence in <GradientText>five minutes</GradientText>
            </>
          }
          subtitle="No scraping, no shared passwords, no cloud bots touching your account."
        />

        <div className="relative mt-16">
          {/* Desktop connecting line (behind the markers) */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-[5px] hidden h-px bg-white/10 lg:block"
          />
          {/* Scroll-driven progress line */}
          <motion.div
            aria-hidden
            style={{ scaleX: reduce ? 1 : progress }}
            className="absolute inset-x-0 top-[5px] hidden h-px origin-left bg-gradient-to-r from-green-500 via-green-400 to-green-300 shadow-[0_0_14px_rgba(34,197,94,0.75)] lg:block"
          />
          {/* Mobile vertical timeline line */}
          <div
            aria-hidden
            className="absolute bottom-6 left-[5px] top-1 w-px bg-gradient-to-b from-green-500/50 via-white/10 to-green-400/30 lg:hidden"
          />

          <Stagger className="grid grid-cols-1 gap-10 lg:grid-cols-4 lg:gap-6">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <StaggerItem
                  key={step.num}
                  className="relative flex flex-col pl-9 lg:pl-0 lg:pt-9"
                >
                  {/* Marker dot on the line */}
                  <span
                    aria-hidden
                    className="absolute left-0 top-1 size-3 rounded-full bg-gradient-to-br from-green-500 to-green-400 shadow-[0_0_14px_rgba(34,197,94,0.85)] ring-4 ring-background lg:left-7 lg:top-0"
                  />

                  <div className="glass group flex-1 rounded-2xl p-7 transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.06]">
                    <div className="flex items-start justify-between gap-4">
                      <span className="font-display text-4xl font-bold tracking-tight text-gradient">
                        {step.num}
                      </span>
                      <span className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-green-300 transition-colors duration-300 group-hover:border-green-500/40 group-hover:text-green-300">
                        <Icon className="size-5" aria-hidden />
                      </span>
                    </div>

                    <h3 className="mt-5 font-display text-lg font-semibold tracking-tight text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {step.desc}
                      {step.soon && <SoonBadge className="ml-2 align-middle" />}
                    </p>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
