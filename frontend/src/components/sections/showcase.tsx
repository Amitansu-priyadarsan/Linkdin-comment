"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Bell,
  Bot,
  Check,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Workflow as WorkflowIcon,
  ChartColumn,
  Sparkles,
} from "lucide-react";
import { Backdrop, GradientText, SectionHeading, SoonBadge } from "@/components/ui";
import { EASE, Reveal } from "@/components/fx/motion";

const TABS = ["Analytics", "AI Assistant", "Workflow"] as const;
type Tab = (typeof TABS)[number];

const TOASTS = [
  "New high-intent post found",
  "+8 profile views today",
  "Draft approved by you",
];

const BARS = [34, 58, 42, 72, 55, 88, 64];

export default function Showcase() {
  const [tab, setTab] = useState<Tab>("Analytics");
  const [toast, setToast] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setToast((t) => (t + 1) % TOASTS.length), 3500);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <section id="showcase" className="relative py-28">
      <Backdrop grid={false} />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
        <SectionHeading
          eyebrow="Product"
          title={
            <>
              Your engagement <GradientText>command center</GradientText>
            </>
          }
          subtitle="One dashboard for every draft, every platform, every result."
        />

        <Reveal className="relative mx-auto mt-14 max-w-4xl">
          {/* Under-glow */}
          <div
            aria-hidden
            className="absolute -bottom-16 left-1/2 h-40 w-4/5 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-600/25 via-indigo-500/20 to-cyan-500/25 blur-[90px]"
          />

          {/* Screen */}
          <div className="relative rounded-[1.4rem] border border-white/10 bg-[#0d0d12] p-2 shadow-[0_40px_120px_-20px_rgba(124,58,237,0.25)]">
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-[#0a0a0f]">
              {/* Browser chrome */}
              <div className="flex h-9 items-center gap-2 border-b border-white/5 px-4">
                <span className="size-2.5 rounded-full bg-red-500/70" />
                <span className="size-2.5 rounded-full bg-amber-400/70" />
                <span className="size-2.5 rounded-full bg-emerald-500/70" />
                <span className="glass mx-auto flex h-5 items-center rounded-md px-8 text-[10px] text-muted">
                  app.commentpilot.ai
                </span>
              </div>

              {/* Cycling toast */}
              <div className="pointer-events-none absolute right-3 top-11 z-20">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={reduce ? "static" : toast}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className="glass-deep flex items-center gap-2 rounded-lg px-3 py-2 text-[10px] text-zinc-200"
                  >
                    <Bell className="size-3 text-violet-300" />
                    {TOASTS[reduce ? 0 : toast]}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex h-[calc(100%-2.25rem)]">
                {/* Sidebar */}
                <div className="flex w-12 shrink-0 flex-col items-center gap-2 border-r border-white/5 py-3">
                  {[LayoutDashboard, MessageSquare, WorkflowIcon, Settings].map(
                    (Icon, i) => (
                      <span
                        key={i}
                        className={`flex size-8 items-center justify-center rounded-lg border ${
                          i === 0
                            ? "border-violet-500/40 bg-violet-500/15 text-violet-300"
                            : "border-white/5 bg-white/[0.03] text-zinc-500"
                        }`}
                      >
                        <Icon className="size-3.5" />
                      </span>
                    )
                  )}
                </div>

                {/* Main area */}
                <div className="flex min-w-0 flex-1 flex-col p-4">
                  {/* Tabs */}
                  <div className="glass flex w-fit items-center gap-1 rounded-lg p-1">
                    {TABS.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`relative rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors ${
                          tab === t ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {tab === t && (
                          <motion.span
                            layoutId="showcase-tab"
                            className="absolute inset-0 rounded-md bg-gradient-to-r from-violet-600/70 to-indigo-600/70"
                            transition={{ duration: 0.35, ease: EASE }}
                          />
                        )}
                        <span className="relative z-10">{t}</span>
                      </button>
                    ))}
                  </div>

                  {/* Tab content */}
                  <div className="relative mt-4 flex-1 overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={tab}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.35, ease: EASE }}
                        className="absolute inset-0"
                      >
                        {tab === "Analytics" && <AnalyticsTab />}
                        {tab === "AI Assistant" && <AssistantTab />}
                        {tab === "Workflow" && <WorkflowTab reduce={!!reduce} />}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Laptop base */}
          <div className="relative mx-auto -mt-px h-3 w-[112%] max-w-[112%] -translate-x-[5.5%] rounded-b-2xl bg-gradient-to-b from-zinc-700 to-zinc-800 sm:h-4">
            <span className="absolute left-1/2 top-0 h-1.5 w-24 -translate-x-1/2 rounded-b-lg bg-zinc-900" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------ Analytics ------------------------------ */

function AnalyticsTab() {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {[
          ["Profile views", "1,284", "+38%"],
          ["Comments", "96", "+12%"],
          ["Replies", "41", "+24%"],
        ].map(([label, value, delta]) => (
          <div key={label} className="glass rounded-lg p-2.5">
            <p className="text-[9px] uppercase tracking-wide text-zinc-500">{label}</p>
            <p className="mt-0.5 flex items-baseline gap-1.5 text-sm font-bold text-zinc-100">
              {value}
              <span className="text-[9px] font-semibold text-emerald-400">{delta}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="glass relative flex-1 rounded-lg p-3">
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
          <ChartColumn className="size-3 text-cyan-300" /> Engagement, last 7 days
        </div>
        <svg viewBox="0 0 280 80" className="mt-2 h-[calc(100%-1.75rem)] w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
            <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d="M0,64 C30,58 45,40 70,42 C95,44 110,26 140,28 C170,30 185,16 215,14 C240,12 260,8 280,6 L280,80 L0,80 Z"
            fill="url(#area-grad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          />
          <motion.path
            d="M0,64 C30,58 45,40 70,42 C95,44 110,26 140,28 C170,30 185,16 215,14 C240,12 260,8 280,6"
            fill="none"
            stroke="url(#line-grad)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, ease: EASE }}
          />
        </svg>
      </div>

      <div className="flex h-14 items-end gap-1.5">
        {BARS.map((h, i) => (
          <motion.div
            key={i}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.6, delay: 0.15 + i * 0.06, ease: EASE }}
            style={{ height: `${h}%` }}
            className="flex-1 origin-bottom rounded-sm bg-gradient-to-t from-violet-600/60 to-cyan-400/60"
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ Assistant ------------------------------ */

function AssistantTab() {
  return (
    <div className="flex h-full flex-col gap-3 text-[11px] leading-relaxed">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: EASE }}
        className="ml-auto max-w-[75%] rounded-xl rounded-br-sm bg-gradient-to-r from-violet-600/50 to-indigo-600/50 px-3 py-2 text-zinc-100"
      >
        Draft a reply to Priya&rsquo;s onboarding post
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45, ease: EASE }}
        className="glass max-w-[85%] rounded-xl rounded-bl-sm px-3 py-2.5 text-zinc-300"
      >
        <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-violet-300">
          <Bot className="size-3" /> CommentPilot
        </span>
        This maps to what we saw too — every extra field is a silent exit door.
        We moved company size to post-activation and conversion jumped 18%. Did
        you gate any fields by intent instead of deleting them?
        <div className="mt-2 flex items-center gap-2">
          <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
            Voice match 92/100
          </span>
          <span className="flex items-center gap-1 rounded-md bg-gradient-to-r from-violet-600 to-cyan-500 px-2.5 py-1 text-[9px] font-semibold text-white">
            <Sparkles className="size-2.5" /> Fill comment
          </span>
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------ Workflow ------------------------------- */

function WorkflowTab({ reduce }: { reduce: boolean }) {
  const nodes = [
    { icon: LayoutDashboard, label: "Scan feed" },
    { icon: ChartColumn, label: "Score 92" },
    { icon: MessageSquare, label: "Draft reply" },
    { icon: Check, label: "You approve" },
  ];
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <div className="flex w-full items-center justify-between gap-1">
        {nodes.map((n, i) => (
          <div key={n.label} className="flex flex-1 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.12, ease: EASE }}
              className="glass flex w-full flex-col items-center gap-1 rounded-lg px-1.5 py-2.5"
            >
              <n.icon className="size-3.5 text-violet-300" />
              <span className="whitespace-nowrap text-[9px] font-medium text-zinc-300">
                {n.label}
              </span>
            </motion.div>
            {i < nodes.length - 1 && (
              <svg viewBox="0 0 24 8" className="w-6 shrink-0">
                <motion.line
                  x1="0"
                  y1="4"
                  x2="24"
                  y2="4"
                  stroke="#818cf8"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  animate={reduce ? undefined : { strokeDashoffset: [0, -16] }}
                  transition={
                    reduce
                      ? undefined
                      : { duration: 1.2, repeat: Infinity, ease: "linear" }
                  }
                />
              </svg>
            )}
          </div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7, ease: EASE }}
        className="flex items-center gap-2 rounded-lg border border-dashed border-violet-500/40 bg-violet-500/5 px-3 py-2"
      >
        <Bot className="size-3.5 text-violet-300" />
        <span className="text-[10px] font-medium text-zinc-300">Auto-post</span>
        <SoonBadge />
      </motion.div>
    </div>
  );
}
