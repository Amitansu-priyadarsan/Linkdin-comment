"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import {
  Backdrop,
  GradientText,
  SectionHeading,
  SoonBadge,
} from "@/components/ui";
import { EASE, Stagger, StaggerItem } from "@/components/fx/motion";

type Plan = {
  name: string;
  monthly: number;
  blurb: string;
  features: { text: string; soon?: boolean }[];
  highlight?: boolean;
  badge?: string;
};

const PLANS: Plan[] = [
  {
    name: "Starter",
    monthly: 19,
    blurb: "Get consistently visible without the grind.",
    features: [
      { text: "150 AI comment drafts / month" },
      { text: "Live feed scanning & post scoring" },
      { text: "1 voice profile" },
      { text: "One-click comment fill" },
      { text: "Email support" },
    ],
  },
  {
    name: "Pro",
    monthly: 39,
    blurb: "For operators serious about pipeline.",
    highlight: true,
    badge: "Most popular",
    features: [
      { text: "Unlimited AI drafts" },
      { text: "Advanced targeting (keywords, roles)" },
      { text: "3 voice profiles" },
      { text: "Engagement analytics", soon: true },
      { text: "Autopilot early access", soon: true },
      { text: "Priority support" },
    ],
  },
  {
    name: "Power",
    monthly: 79,
    blurb: "Every platform, every seat, maximum reach.",
    badge: "Best value",
    features: [
      { text: "Everything in Pro" },
      { text: "Reddit & X agents at launch" },
      { text: "Auto-posting at launch" },
      { text: "3 team seats" },
      { text: "Dedicated support" },
    ],
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const reduce = useReducedMotion();

  return (
    <section id="pricing" className="relative py-28">
      <Backdrop />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
        <SectionHeading
          eyebrow="Pricing"
          title={
            <>
              Less than one hour of <GradientText>your time</GradientText>
            </>
          }
          subtitle="Every plan starts with a 5-day free trial. Cancel anytime, one click."
        />

        {/* Billing toggle */}
        <div className="mt-10 flex items-center justify-center gap-3">
          <div className="glass flex items-center rounded-full p-1">
            {(["Monthly", "Annual"] as const).map((label) => {
              const active = (label === "Annual") === annual;
              return (
                <button
                  key={label}
                  onClick={() => setAnnual(label === "Annual")}
                  className={`relative rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                    active ? "text-white" : "text-muted hover:text-zinc-200"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="billing-pill"
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-green-600 to-green-700"
                      transition={{ duration: 0.35, ease: EASE }}
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </button>
              );
            })}
          </div>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-300">
            Save 20%
          </span>
        </div>

        <Stagger className="mt-12 grid items-stretch gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const price = annual ? Math.round(plan.monthly * 0.8) : plan.monthly;
            return (
              <StaggerItem key={plan.name} className="h-full">
                <motion.div
                  whileHover={reduce ? undefined : { y: -6 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className={`relative flex h-full flex-col rounded-3xl p-8 ${
                    plan.highlight
                      ? "animated-border bg-surface/80 shadow-[0_0_60px_rgba(34,197,94,0.25)] lg:scale-[1.045]"
                      : "glass"
                  }`}
                >
                  {plan.badge &&
                    (plan.highlight ? (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-green-600 to-green-400 px-4 py-1 text-xs font-bold text-white shadow-[0_0_24px_rgba(34,197,94,0.5)]">
                        {plan.badge}
                      </span>
                    ) : (
                      <span className="absolute right-6 top-6 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 text-[11px] font-semibold text-zinc-300">
                        {plan.badge}
                      </span>
                    ))}

                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted">{plan.blurb}</p>

                  <div className="mt-6 flex items-baseline gap-1.5">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={annual ? "a" : "m"}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25, ease: EASE }}
                        className="font-display text-5xl font-bold tracking-tight text-foreground"
                      >
                        ${price}
                      </motion.span>
                    </AnimatePresence>
                    <span className="text-sm text-muted">
                      /mo{annual && ", billed annually"}
                    </span>
                  </div>

                  <ul className="mt-7 flex-1 space-y-3">
                    {plan.features.map((f) => (
                      <li
                        key={f.text}
                        className="flex items-start gap-2.5 text-sm text-zinc-300"
                      >
                        <Check className="mt-0.5 size-4 shrink-0 text-green-300" />
                        <span className="flex flex-wrap items-center gap-2">
                          {f.text}
                          {f.soon && <SoonBadge />}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/signup"
                    className={`mt-8 inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300 ${
                      plan.highlight
                        ? "bg-gradient-to-r from-green-600 via-green-500 to-green-400 text-white shadow-[0_0_32px_rgba(34,197,94,0.35)] hover:shadow-[0_0_48px_rgba(34,197,94,0.55)]"
                        : "glass text-foreground hover:border-white/25 hover:bg-white/[0.08]"
                    }`}
                  >
                    Start free trial
                  </Link>
                </motion.div>
              </StaggerItem>
            );
          })}
        </Stagger>

        <p className="mt-10 text-center text-sm text-muted">
          Need seats for a team of 5+?{" "}
          <a
            href="mailto:hello@commentpilot.ai"
            className="font-semibold text-green-300 transition-colors hover:text-green-200"
          >
            Talk to us
          </a>
        </p>
      </div>
    </section>
  );
}
