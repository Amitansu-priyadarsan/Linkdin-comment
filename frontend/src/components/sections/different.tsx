"use client";

import { ArrowUpRight } from "lucide-react";
import { GradientText, SectionHeading } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/fx/motion";

type Cell = {
  title: string;
  desc: string;
  align: "left" | "right";
};

const CELLS: Cell[] = [
  {
    title: "Smart Automation",
    desc: "Scores every post in your feed and drafts replies before you even open LinkedIn.",
    align: "left",
  },
  {
    title: "Human-like Voice",
    desc: "Trained on your past comments — nobody can tell a draft from the real you.",
    align: "right",
  },
  {
    title: "ToS-safe by Design",
    desc: "Runs in your own browser. No scraping, no shared passwords, no cloud bots.",
    align: "left",
  },
  {
    title: "Compounding Reach",
    desc: "Every approved comment compounds into profile views, followers and inbound leads.",
    align: "right",
  },
];

export default function Different() {
  return (
    <section className="relative py-28">
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
        <SectionHeading
          eyebrow="Why us"
          title={
            <>
              What makes CommentPilot <GradientText>different</GradientText>
            </>
          }
        />

        <div className="relative mt-16">
          {/* Centered mascot, overlapping the four cells */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 lg:block"
          >
            <div className="absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-600/30 blur-[90px]" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/robot-mascot.png?v=5"
              alt=""
              width={380}
              height={380}
              decoding="async"
              className="animate-float-slow drop-shadow-[0_24px_60px_rgba(34,197,94,0.25)]"
            />
          </div>

          <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {CELLS.map((cell) => (
              <StaggerItem key={cell.title}>
                <div
                  className={`glass group relative flex min-h-56 flex-col justify-between overflow-hidden rounded-3xl p-8 transition-colors duration-300 hover:border-green-500/30 lg:min-h-72 ${
                    cell.align === "right" ? "items-end text-right" : ""
                  }`}
                >
                  <div
                    aria-hidden
                    className="absolute -top-20 left-1/2 h-40 w-3/4 -translate-x-1/2 rounded-full bg-green-500/10 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  />
                  <div className={cell.align === "right" ? "lg:pl-24" : "lg:pr-24"}>
                    <h3 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      {cell.title}
                    </h3>
                    <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
                      {cell.desc}
                    </p>
                  </div>
                  <a
                    href="#how-it-works"
                    className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-green-300 transition-colors hover:text-green-200"
                  >
                    Discover our approach
                    <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </a>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
