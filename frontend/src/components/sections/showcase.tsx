"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  Bell,
  Bot,
  Check,
  ChevronDown,
  Eye,
  LayoutDashboard,
  MessageSquare,
  Pause,
  Play,
  Send,
  Settings,
  Sparkles,
  TrendingUp,
  Workflow as WorkflowIcon,
} from "lucide-react";
import {
  Backdrop,
  GradientText,
  SectionHeading,
  SoonBadge,
} from "@/components/ui";
import { EASE, Reveal } from "@/components/fx/motion";

/* ----------------------------- App data types ---------------------------- */

type Page = "dashboard" | "assistant" | "workflow" | "settings";
type Metric = "views" | "comments" | "replies";
type Range = "7d" | "30d";
type Toast = { id: number; text: string };
type Msg = { id: number; role: "user" | "ai"; text: string };

const METRICS: {
  key: Metric;
  label: string;
  value: string;
  delta: string;
  icon: typeof Eye;
}[] = [
  { key: "views", label: "Profile views", value: "1,284", delta: "+38%", icon: Eye },
  { key: "comments", label: "Comments", value: "96", delta: "+12%", icon: MessageSquare },
  { key: "replies", label: "Replies", value: "41", delta: "+24%", icon: TrendingUp },
];

const CHART: Record<Metric, Record<Range, { label: string; value: number }[]>> = {
  views: {
    "7d": [
      { label: "Mon", value: 122 },
      { label: "Tue", value: 214 },
      { label: "Wed", value: 168 },
      { label: "Thu", value: 251 },
      { label: "Fri", value: 190 },
      { label: "Sat", value: 142 },
      { label: "Sun", value: 197 },
    ],
    "30d": [
      { label: "W1", value: 820 },
      { label: "W2", value: 1040 },
      { label: "W3", value: 1215 },
      { label: "W4", value: 1284 },
    ],
  },
  comments: {
    "7d": [
      { label: "Mon", value: 9 },
      { label: "Tue", value: 16 },
      { label: "Wed", value: 12 },
      { label: "Thu", value: 19 },
      { label: "Fri", value: 15 },
      { label: "Sat", value: 10 },
      { label: "Sun", value: 15 },
    ],
    "30d": [
      { label: "W1", value: 58 },
      { label: "W2", value: 71 },
      { label: "W3", value: 88 },
      { label: "W4", value: 96 },
    ],
  },
  replies: {
    "7d": [
      { label: "Mon", value: 3 },
      { label: "Tue", value: 8 },
      { label: "Wed", value: 5 },
      { label: "Thu", value: 9 },
      { label: "Fri", value: 6 },
      { label: "Sat", value: 4 },
      { label: "Sun", value: 6 },
    ],
    "30d": [
      { label: "W1", value: 18 },
      { label: "W2", value: 26 },
      { label: "W3", value: 34 },
      { label: "W4", value: 41 },
    ],
  },
};

const TOP_COMMENTS = [
  { post: "Priya S. — onboarding drop-off", views: 214, replies: 12 },
  { post: "Marcus L. — pricing pages that convert", views: 187, replies: 9 },
  { post: "Aditi R. — founder-led sales myths", views: 156, replies: 7 },
];

const BELL_POOL = [
  "New high-intent post found",
  "+8 profile views today",
  "Priya replied to your comment",
  "Weekly digest is ready",
];

const AI_REPLIES = [
  "Drafted. I kept your usual concrete-example-first structure and ended with a question to invite a reply.",
  "Regenerated with a sharper hook. Voice match is at 94/100 — want it more casual?",
  "Queued three more drafts from today’s top-scored posts. Review them when ready.",
];

/* -------------------------------- Section -------------------------------- */

export default function Showcase() {
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
        />
        <Reveal className="mt-16">
          <Laptop />
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------- Laptop -------------------------------- */

function Laptop() {
  const shellRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [showHint, setShowHint] = useState(true);
  const [interactive, setInteractive] = useState(false);

  const { scrollYProgress } = useScroll({
    target: shellRef,
    offset: ["start 0.92", "start 0.32"],
  });
  const lidProgress = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 22,
    mass: 0.65,
  });
  const rotateX = useTransform(lidProgress, [0, 1], [-88, 0]);
  const screenDim = useTransform(lidProgress, [0, 0.55, 1], [0.85, 0.15, 0]);

  useMotionValueEvent(lidProgress, "change", (v) => {
    setShowHint(v < 0.08);
    setInteractive(v > 0.85);
  });

  function nudgeOpen() {
    shellRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const canInteract = reduce || interactive;

  return (
    <div
      ref={shellRef}
      className="relative mx-auto max-w-4xl [perspective:1800px]"
      onClick={() => {
        if (!canInteract) nudgeOpen();
      }}
    >
      {/* Under-glow */}
      <div
        aria-hidden
        className="absolute -bottom-16 left-1/2 h-40 w-4/5 -translate-x-1/2 rounded-full bg-gradient-to-r from-green-600/25 via-green-500/20 to-green-400/25 blur-[90px]"
      />

      {/* Lid (screen) — opens/closes with scroll progress */}
      <motion.div
        style={{
          rotateX: reduce ? 0 : rotateX,
          transformOrigin: "bottom center",
          transformStyle: "preserve-3d",
        }}
        className="relative cursor-pointer rounded-[1.4rem] border border-white/10 bg-[#0d0d12] p-2 shadow-[0_40px_120px_-20px_rgba(34,197,94,0.25)]"
      >
        <div
          className={`relative aspect-[16/10] overflow-hidden rounded-xl bg-[#0a0a0f] ${
            canInteract ? "" : "pointer-events-none"
          }`}
        >
          <MiniApp />
          {/* Screen dims while the lid is closed */}
          <motion.div
            aria-hidden
            style={{ opacity: reduce ? 0 : screenDim }}
            className="pointer-events-none absolute inset-0 z-30 bg-black"
          />
        </div>
      </motion.div>

      {/* Base */}
      <div className="relative mx-auto -mt-px h-3 w-[112%] max-w-[112%] -translate-x-[5.5%] rounded-b-2xl bg-gradient-to-b from-zinc-700 to-zinc-800 sm:h-4">
        <span className="absolute left-1/2 top-0 h-1.5 w-24 -translate-x-1/2 rounded-b-lg bg-zinc-900" />
      </div>

      {/* Scroll / click-to-open hint */}
      <AnimatePresence>
        {showHint && !reduce && (
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="glass absolute -bottom-14 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium text-zinc-300"
          >
            Scroll to open — it&rsquo;s a live demo
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------- Mini app ------------------------------- */

function MiniApp() {
  const [page, setPage] = useState<Page>("dashboard");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
  const bellIndex = useRef(0);

  useEffect(() => {
    const pending = timeouts.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  function pushToast(text: string) {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, text }]);
    timeouts.current.push(
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800)
    );
  }

  const NAV: { key: Page; icon: typeof LayoutDashboard; label: string }[] = [
    { key: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { key: "assistant", icon: MessageSquare, label: "AI Assistant" },
    { key: "workflow", icon: WorkflowIcon, label: "Workflow" },
    { key: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="absolute inset-0 flex flex-col font-sans">
      {/* Browser chrome */}
      <div className="flex h-8 shrink-0 items-center gap-2 border-b border-white/5 px-3 sm:h-9 sm:px-4">
        <span className="size-2 rounded-full bg-red-500/70 sm:size-2.5" />
        <span className="size-2 rounded-full bg-amber-400/70 sm:size-2.5" />
        <span className="size-2 rounded-full bg-emerald-500/70 sm:size-2.5" />
        <span className="glass mx-auto flex h-5 items-center rounded-md px-4 text-[9px] text-muted sm:px-8 sm:text-[10px]">
          app.commentpilot.ai/{page}
        </span>
        <button
          type="button"
          aria-label="Trigger a notification"
          onClick={() => {
            pushToast(BELL_POOL[bellIndex.current % BELL_POOL.length]);
            bellIndex.current += 1;
          }}
          className="group relative flex size-6 items-center justify-center rounded-md border border-white/5 bg-white/[0.03] text-zinc-400 transition-colors hover:border-green-500/40 hover:text-green-300"
        >
          <Bell className="size-3" />
          <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-green-500 transition-transform group-hover:scale-125" />
        </button>
      </div>

      {/* Toast stack */}
      <div className="pointer-events-none absolute right-2 top-10 z-20 flex flex-col items-end gap-1.5 sm:right-3 sm:top-11">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="glass-deep flex items-center gap-2 rounded-lg px-3 py-1.5 text-[9px] text-zinc-200 sm:py-2 sm:text-[10px]"
            >
              <Bell className="size-3 shrink-0 text-green-300" />
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <nav
          aria-label="Demo app pages"
          className="flex w-10 shrink-0 flex-col items-center gap-1.5 border-r border-white/5 py-2.5 sm:w-12 sm:gap-2 sm:py-3"
        >
          {NAV.map((item) => {
            const active = page === item.key;
            return (
              <button
                key={item.key}
                type="button"
                title={item.label}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                onClick={() => setPage(item.key)}
                className={`relative flex size-7 items-center justify-center rounded-lg transition-colors sm:size-8 ${
                  active
                    ? "text-green-200"
                    : "text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-300"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="mini-sidebar-active"
                    className="absolute inset-0 rounded-lg border border-green-500/40 bg-green-500/15"
                    transition={{ duration: 0.3, ease: EASE }}
                  />
                )}
                <item.icon className="relative z-10 size-3.5" />
              </button>
            );
          })}
        </nav>

        {/* Page content */}
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="absolute inset-0 overflow-y-auto p-2.5 sm:p-4"
            >
              {page === "dashboard" && <DashboardPage onToast={pushToast} />}
              {page === "assistant" && <AssistantPage />}
              {page === "workflow" && <WorkflowPage onToast={pushToast} />}
              {page === "settings" && <SettingsPage onToast={pushToast} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Dashboard ------------------------------- */

function DashboardPage({ onToast }: { onToast: (t: string) => void }) {
  const [metric, setMetric] = useState<Metric>("views");
  const [range, setRange] = useState<Range>("7d");
  const [selectedBar, setSelectedBar] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(true);

  const data = CHART[metric][range];
  const max = Math.max(...data.map((d) => d.value));
  const metricLabel = METRICS.find((m) => m.key === metric)?.label ?? "";

  return (
    <div className="flex flex-col gap-2.5 sm:gap-3">
      {/* Metric cards — click to change the chart */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {METRICS.map((m) => {
          const active = metric === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => {
                setMetric(m.key);
                setSelectedBar(null);
              }}
              className={`group rounded-lg border p-2 text-left transition-all duration-200 hover:-translate-y-0.5 sm:p-2.5 ${
                active
                  ? "border-green-500/50 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.2)]"
                  : "border-white/5 bg-white/[0.03] hover:border-white/15"
              }`}
            >
              <p className="flex items-center gap-1 text-[8px] uppercase tracking-wide text-zinc-500 sm:text-[9px]">
                <m.icon className="size-2.5" /> {m.label}
              </p>
              <p className="mt-0.5 flex items-baseline gap-1.5 text-xs font-bold text-zinc-100 sm:text-sm">
                {m.value}
                <span className="text-[8px] font-semibold text-emerald-400 sm:text-[9px]">
                  {m.delta}
                </span>
              </p>
            </button>
          );
        })}
      </div>

      {/* Chart card */}
      <div className="rounded-lg border border-white/5 bg-white/[0.03] p-2.5 sm:p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[9px] text-zinc-400 sm:text-[10px]">
            {metricLabel} — click a bar
          </p>
          {/* Range tabs */}
          <div className="flex rounded-md border border-white/10 p-0.5">
            {(["7d", "30d"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRange(r);
                  setSelectedBar(null);
                }}
                className={`relative rounded px-2 py-0.5 text-[8px] font-semibold transition-colors sm:text-[9px] ${
                  range === r ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {range === r && (
                  <motion.span
                    layoutId="mini-range-tab"
                    className="absolute inset-0 rounded bg-gradient-to-r from-green-600/70 to-green-700/70"
                    transition={{ duration: 0.25, ease: EASE }}
                  />
                )}
                <span className="relative z-10">{r}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected bar readout */}
        <div className="mt-1.5 h-4">
          <AnimatePresence mode="wait">
            {selectedBar !== null && data[selectedBar] && (
              <motion.p
                key={`${metric}-${range}-${selectedBar}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-[9px] font-semibold text-green-300 sm:text-[10px]"
              >
                {data[selectedBar].label}: {data[selectedBar].value.toLocaleString()}{" "}
                {metricLabel.toLowerCase()}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Bars */}
        <div className="mt-1 flex h-16 items-end gap-1 sm:h-20 sm:gap-1.5">
          {data.map((d, i) => {
            const selected = selectedBar === i;
            return (
              <button
                key={`${range}-${d.label}`}
                type="button"
                aria-label={`${d.label}: ${d.value}`}
                onClick={() => setSelectedBar(selected ? null : i)}
                className="group flex h-full flex-1 flex-col items-center justify-end gap-1"
              >
                <motion.span
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.05, ease: EASE }}
                  style={{ height: `${(d.value / max) * 100}%` }}
                  className={`w-full origin-bottom rounded-sm transition-all duration-200 ${
                    selected
                      ? "bg-gradient-to-t from-green-500 to-green-300 shadow-[0_0_14px_rgba(74,222,128,0.5)]"
                      : "bg-gradient-to-t from-green-600/60 to-green-400/60 group-hover:from-green-500 group-hover:to-green-300"
                  }`}
                />
                <span
                  className={`text-[7px] sm:text-[8px] ${
                    selected ? "font-bold text-green-300" : "text-zinc-600"
                  }`}
                >
                  {d.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Expandable analytics */}
      <div className="rounded-lg border border-white/5 bg-white/[0.03]">
        <button
          type="button"
          onClick={() => {
            setExpanded((v) => !v);
            if (!expanded) onToast("Analytics expanded");
          }}
          aria-expanded={expanded}
          className="flex w-full items-center justify-between px-2.5 py-2 text-[9px] font-semibold text-zinc-300 transition-colors hover:text-white sm:px-3 sm:text-[10px]"
        >
          Top performing comments
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <ChevronDown className="size-3 text-zinc-500" />
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="rows"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="overflow-hidden"
            >
              <div className="space-y-1 px-2.5 pb-2.5 sm:px-3 sm:pb-3">
                {TOP_COMMENTS.map((c) => (
                  <div
                    key={c.post}
                    className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] px-2 py-1.5 transition-colors hover:border-green-500/30 hover:bg-green-500/5"
                  >
                    <span className="truncate pr-2 text-[8px] text-zinc-300 sm:text-[9px]">
                      {c.post}
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-[8px] text-zinc-500 sm:text-[9px]">
                      <span className="flex items-center gap-0.5">
                        <Eye className="size-2.5" /> {c.views}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <MessageSquare className="size-2.5" /> {c.replies}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------- Assistant ------------------------------- */

function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 1,
      role: "ai",
      text: "I found 3 high-intent posts in your feed. Want drafts for them?",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const msgId = useRef(1);
  const aiIndex = useRef(0);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pending = timeouts.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    setMessages((m) => [...m, { id: ++msgId.current, role: "user", text: trimmed }]);
    setInput("");
    setTyping(true);
    timeouts.current.push(
      setTimeout(() => {
        setMessages((m) => [
          ...m,
          {
            id: ++msgId.current,
            role: "ai",
            text: AI_REPLIES[aiIndex.current % AI_REPLIES.length],
          },
        ]);
        aiIndex.current += 1;
        setTyping(false);
      }, 900)
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1"
      >
        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className={`max-w-[85%] rounded-xl px-2.5 py-1.5 text-[9px] leading-relaxed sm:px-3 sm:py-2 sm:text-[10px] ${
              m.role === "user"
                ? "ml-auto rounded-br-sm bg-gradient-to-r from-green-600/50 to-green-700/50 text-zinc-100"
                : "glass rounded-bl-sm text-zinc-300"
            }`}
          >
            {m.role === "ai" && (
              <span className="mb-1 flex items-center gap-1 text-[8px] font-semibold text-green-300 sm:text-[9px]">
                <Bot className="size-2.5" /> CommentPilot
              </span>
            )}
            {m.text}
          </motion.div>
        ))}
        {typing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass flex w-fit items-center gap-1 rounded-xl rounded-bl-sm px-3 py-2"
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                className="size-1 rounded-full bg-green-300"
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Quick actions */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {["Draft a reply", "Regenerate", "Queue 3 drafts"].map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => send(q)}
            className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[8px] font-medium text-zinc-300 transition-colors hover:border-green-500/40 hover:text-green-200 sm:text-[9px]"
          >
            <Sparkles className="mr-1 inline size-2.5 text-green-300" />
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-2 flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] p-1 focus-within:border-green-500/50"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the assistant…"
          aria-label="Message the assistant"
          className="min-w-0 flex-1 bg-transparent px-2 text-[9px] text-zinc-200 outline-none placeholder:text-zinc-600 sm:text-[10px]"
        />
        <button
          type="submit"
          aria-label="Send"
          className="flex size-6 items-center justify-center rounded-md bg-gradient-to-r from-green-600 to-green-400 text-white transition-shadow hover:shadow-[0_0_14px_rgba(34,197,94,0.5)]"
        >
          <Send className="size-3" />
        </button>
      </form>
    </div>
  );
}

/* -------------------------------- Workflow ------------------------------- */

function WorkflowPage({ onToast }: { onToast: (t: string) => void }) {
  const [paused, setPaused] = useState<Record<string, boolean>>({});

  const NODES = [
    { key: "scan", icon: LayoutDashboard, label: "Scan feed" },
    { key: "score", icon: TrendingUp, label: "Score posts" },
    { key: "draft", icon: MessageSquare, label: "Draft reply" },
    { key: "approve", icon: Check, label: "You approve" },
  ];

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 sm:gap-4">
      <p className="text-[9px] text-zinc-500 sm:text-[10px]">
        Click a step to pause or resume it
      </p>
      <div className="flex w-full items-center justify-between gap-1">
        {NODES.map((n, i) => {
          const isPaused = !!paused[n.key];
          return (
            <div key={n.key} className="flex flex-1 items-center">
              <button
                type="button"
                onClick={() => {
                  setPaused((p) => ({ ...p, [n.key]: !p[n.key] }));
                  onToast(`${n.label} ${isPaused ? "resumed" : "paused"}`);
                }}
                className={`group flex w-full flex-col items-center gap-1 rounded-lg border px-1.5 py-2.5 transition-all duration-200 hover:-translate-y-0.5 ${
                  isPaused
                    ? "border-amber-500/40 bg-amber-500/5 opacity-70"
                    : "glass hover:border-green-500/40"
                }`}
              >
                <n.icon
                  className={`size-3.5 ${isPaused ? "text-amber-300" : "text-green-300"}`}
                />
                <span className="whitespace-nowrap text-[8px] font-medium text-zinc-300 sm:text-[9px]">
                  {n.label}
                </span>
                <span className="flex items-center gap-0.5 text-[7px] text-zinc-500 sm:text-[8px]">
                  {isPaused ? (
                    <>
                      <Pause className="size-2" /> paused
                    </>
                  ) : (
                    <>
                      <Play className="size-2" /> running
                    </>
                  )}
                </span>
              </button>
              {i < NODES.length - 1 && (
                <svg viewBox="0 0 24 8" className="w-4 shrink-0 sm:w-6" aria-hidden>
                  <line
                    x1="0"
                    y1="4"
                    x2="24"
                    y2="4"
                    stroke={isPaused ? "#71717a" : "#22c55e"}
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                </svg>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onToast("Autopilot is coming soon — you’re on the list")}
        className="flex items-center gap-2 rounded-lg border border-dashed border-green-500/40 bg-green-500/5 px-3 py-2 transition-colors hover:bg-green-500/10"
      >
        <Bot className="size-3.5 text-green-300" />
        <span className="text-[9px] font-medium text-zinc-300 sm:text-[10px]">
          Auto-post
        </span>
        <SoonBadge />
      </button>
    </div>
  );
}

/* -------------------------------- Settings ------------------------------- */

function SettingsPage({ onToast }: { onToast: (t: string) => void }) {
  const [prefs, setPrefs] = useState({
    autoQueue: true,
    dailyDigest: false,
    safeMode: true,
  });

  const ROWS: { key: keyof typeof prefs; label: string; desc: string }[] = [
    {
      key: "autoQueue",
      label: "Auto-queue drafts",
      desc: "Queue drafts for top-scored posts automatically",
    },
    {
      key: "dailyDigest",
      label: "Daily digest",
      desc: "Morning summary of results and new opportunities",
    },
    {
      key: "safeMode",
      label: "Safe mode",
      desc: "Skip political and sensitive posts entirely",
    },
  ];

  return (
    <div className="flex h-full flex-col gap-2">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500 sm:text-[10px]">
        Workspace settings
      </p>
      {ROWS.map((row) => {
        const on = prefs[row.key];
        return (
          <button
            key={row.key}
            type="button"
            role="switch"
            aria-checked={on}
            onClick={() => setPrefs((p) => ({ ...p, [row.key]: !p[row.key] }))}
            className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-2 text-left transition-colors hover:border-white/15 sm:px-3 sm:py-2.5"
          >
            <span>
              <span className="block text-[9px] font-semibold text-zinc-200 sm:text-[10px]">
                {row.label}
              </span>
              <span className="block text-[8px] text-zinc-500 sm:text-[9px]">
                {row.desc}
              </span>
            </span>
            <span
              className={`relative h-4 w-7 shrink-0 rounded-full transition-colors duration-200 ${
                on ? "bg-gradient-to-r from-green-600 to-green-400" : "bg-white/10"
              }`}
            >
              <motion.span
                animate={{ x: on ? 13 : 2 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="absolute top-0.5 size-3 rounded-full bg-white shadow"
              />
            </span>
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onToast("Settings saved")}
        className="mt-auto flex items-center justify-center gap-1.5 self-start rounded-lg bg-gradient-to-r from-green-600 to-green-400 px-3 py-1.5 text-[9px] font-semibold text-white transition-shadow hover:shadow-[0_0_18px_rgba(34,197,94,0.45)] sm:text-[10px]"
      >
        <Check className="size-3" /> Save changes
      </button>
    </div>
  );
}
