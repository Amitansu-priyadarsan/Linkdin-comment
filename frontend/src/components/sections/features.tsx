"use client";

import {
  Bot,
  ChartColumn,
  Workflow,
  Target,
  ShieldCheck,
  Plug,
  type LucideIcon,
} from "lucide-react";
import { SectionHeading, GradientText, SoonBadge, Backdrop } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/fx/motion";
import { TiltCard } from "@/components/fx/tilt-card";

type Feature = {
  icon: LucideIcon;
  title: string;
  body: string;
  soon?: boolean;
};

const FEATURES: Feature[] = [
  {
    icon: Bot,
    title: "AI Comment Drafting",
    body: "Value-first replies drafted in your voice, tuned by every edit you make. Never generic bot-speak.",
  },
  {
    icon: ChartColumn,
    title: "Real-time Post Scoring",
    body: "Every post in your feed is scored for relevance and reach potential, so you spend words where they compound.",
  },
  {
    icon: Workflow,
    title: "Autopilot Workflows",
    body: "Set your targets and let the agent find posts and comment 24/7 with natural, human pacing.",
    soon: true,
  },
  {
    icon: Target,
    title: "Precision Targeting",
    body: "Keywords, roles, industries and geography filters put you in front of buyers, not noise.",
    soon: true,
  },
  {
    icon: ShieldCheck,
    title: "Account-Safe by Design",
    body: "Runs entirely in your browser. Our servers never touch LinkedIn - no shared passwords, no cloud bots.",
  },
  {
    icon: Plug,
    title: "API & Integrations",
    body: "Pipe engagement signals into your CRM and workflows, and trigger drafts programmatically.",
    soon: true,
  },
];

export default function Features() {
  return (
    <section id="features" className="relative py-28">
      <Backdrop grid={false} />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
        <SectionHeading
          eyebrow="Features"
          title={
            <>
              Everything you need to <GradientText>win the feed</GradientText>
            </>
          }
          subtitle="Not just commenting - a complete engagement engine that gets sharper every week."
        />

        <Stagger className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <StaggerItem key={feature.title} className="h-full">
                <TiltCard className="glass h-full rounded-2xl border border-white/10 p-7 transition-colors duration-300 hover:border-violet-500/40">
                  <div className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-violet-600/25 to-cyan-500/15">
                    <Icon className="size-5 text-violet-300 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110" />
                  </div>
                  <h3 className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-lg font-semibold text-foreground">
                    {feature.title}
                    {feature.soon && <SoonBadge />}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{feature.body}</p>
                </TiltCard>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
