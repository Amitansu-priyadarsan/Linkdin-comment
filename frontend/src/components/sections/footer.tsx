"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Mail } from "lucide-react";
import { BRAND, Logo } from "@/components/brand";
import { LiveBadge, SoonBadge } from "@/components/ui";
import { EASE } from "@/components/fx/motion";

const COLS: {
  title: string;
  links: { label: string; href: string; badge?: "live" | "soon" }[];
}[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Showcase", href: "#showcase" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Platforms",
    links: [
      { label: "LinkedIn", href: "#features", badge: "live" },
      { label: "Reddit", href: "#features", badge: "soon" },
      { label: "X (Twitter)", href: "#features", badge: "soon" },
      { label: "Auto-posting", href: "#features", badge: "soon" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "#" },
      { label: "Chrome extension", href: "#" },
      { label: "Support", href: "#" },
      { label: "FAQ", href: "#faq" },
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
];

function XMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.9 2H22l-6.8 7.8L23.3 22h-6.3l-4.9-6.4L6.5 22H3.4l7.3-8.3L2.5 2h6.4l4.4 5.9L18.9 2Zm-1.1 18.1h1.7L7.1 3.8H5.3l12.5 16.3Z" />
    </svg>
  );
}

function LinkedInMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.4 20.4h-3.5v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9v5.7H9.4V9h3.4v1.6h.1c.5-.9 1.6-1.9 3.4-1.9 3.6 0 4.2 2.4 4.2 5.4v6.3ZM5.3 7.4a2 2 0 1 1 0-4.1 2 2 0 0 1 0 4.1Zm1.8 13H3.6V9h3.5v11.4ZM22.2 0H1.8C.8 0 0 .8 0 1.7v20.6c0 1 .8 1.7 1.8 1.7h20.4c1 0 1.8-.8 1.8-1.7V1.7c0-1-.8-1.7-1.8-1.7Z" />
    </svg>
  );
}

function GitHubMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 .5C5.6.5.5 5.6.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0C17.2 4.9 18.2 5.2 18.2 5.2c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6a11.5 11.5 0 0 0 7.7-10.9C23.5 5.6 18.4.5 12 .5Z" />
    </svg>
  );
}

export default function Footer() {
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer className="relative border-t border-white/5 bg-surface/30">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

      <div className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1.6fr]">
          {/* Brand */}
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              AI agents that comment in your voice, so the right people see you
              every day.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {[
                { label: "X", node: <XMark className="size-4" /> },
                { label: "LinkedIn", node: <LinkedInMark className="size-4" /> },
                { label: "GitHub", node: <GitHubMark className="size-4" /> },
                { label: "Email", node: <Mail className="size-4" /> },
              ].map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="glass flex size-9 items-center justify-center rounded-lg text-muted transition-colors duration-300 hover:border-violet-500/40 hover:text-foreground"
                >
                  {s.node}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {COLS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-foreground">{col.title}</h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label} className="flex items-center gap-2">
                    <a
                      href={l.href}
                      className="text-sm text-muted transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </a>
                    {l.badge === "live" && <LiveBadge />}
                    {l.badge === "soon" && <SoonBadge />}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-semibold text-foreground">Product updates</h4>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              New platforms, autopilot progress, growth tactics. No spam.
            </p>
            {subscribed ? (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="mt-5 flex items-center gap-2 text-sm font-medium text-emerald-300"
              >
                <Check className="size-4" /> You&rsquo;re on the list.
              </motion.p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubscribed(true);
                }}
                className="glass mt-5 flex items-center rounded-xl p-1"
              >
                <input
                  type="email"
                  required
                  placeholder="you@company.com"
                  aria-label="Email address"
                  className="w-full min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-zinc-500"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="flex items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-2 text-white transition-shadow hover:shadow-[0_0_24px_rgba(124,58,237,0.45)]"
                >
                  <ArrowRight className="size-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-sm text-muted sm:flex-row">
          <p>
            © {new Date().getFullYear()} {BRAND}. All rights reserved.
          </p>
          <p>Made for people who&rsquo;d rather build than scroll.</p>
        </div>
      </div>
    </footer>
  );
}
