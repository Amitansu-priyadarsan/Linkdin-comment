"use client";

import { Stagger, StaggerItem } from "@/components/fx/motion";
import { Counter } from "@/components/fx/counter";

type Stat = {
  to: number;
  suffix: string;
  decimals: number;
  label: string;
  /** Divider borders: 2x2 grid on mobile, 1x4 row on lg. */
  border: string;
};

const STATS: Stat[] = [
  {
    to: 12,
    suffix: "K+",
    decimals: 0,
    label: "Creators & teams",
    border: "",
  },
  {
    to: 1.2,
    suffix: "M+",
    decimals: 1,
    label: "Comments drafted",
    border: "border-l border-white/5",
  },
  {
    to: 99.9,
    suffix: "%",
    decimals: 1,
    label: "Uptime",
    border: "border-t border-white/5 lg:border-t-0 lg:border-l",
  },
  {
    to: 5,
    suffix: "×",
    decimals: 0,
    label: "Avg. profile-view lift",
    border: "border-l border-t border-white/5 lg:border-t-0",
  },
];

export default function Stats() {
  return (
    <section aria-label="CommentPilot in numbers" className="relative py-20">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="relative">
          {/* Faint gradient glow behind the panel */}
          <div aria-hidden className="pointer-events-none absolute -inset-10">
            <div className="absolute left-[8%] top-1/2 h-52 w-[45%] -translate-y-1/2 rounded-full bg-green-600/15 blur-[110px]" />
            <div className="absolute right-[8%] top-1/2 h-52 w-[45%] -translate-y-1/2 rounded-full bg-green-500/10 blur-[110px]" />
          </div>

          <Stagger className="glass relative grid grid-cols-2 overflow-hidden rounded-3xl lg:grid-cols-4">
            {STATS.map((stat) => (
              <StaggerItem
                key={stat.label}
                className={`p-8 text-center ${stat.border}`}
              >
                <Counter
                  to={stat.to}
                  suffix={stat.suffix}
                  decimals={stat.decimals}
                  className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl"
                />
                <p className="mt-2 text-sm text-muted">{stat.label}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
