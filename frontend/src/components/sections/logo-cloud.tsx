"use client";

import { Reveal } from "@/components/fx/motion";
import { Marquee } from "@/components/fx/marquee";

/* ----------------------------- Data ----------------------------- */

type GlyphKind = "circle" | "triangle" | "hex";

type Wordmark = {
  name: string;
  glyph: GlyphKind;
  color: string;
};

/* Ampersand lives inside a JS string (not literal JSX text). */
const WORDMARKS: Wordmark[] = [
  { name: "Northwind", glyph: "hex", color: "text-green-400" },
  { name: "Vertex Labs", glyph: "triangle", color: "text-green-400" },
  { name: "Lumina", glyph: "circle", color: "text-green-400" },
  { name: "Nexora", glyph: "hex", color: "text-green-400" },
  { name: "Quantica", glyph: "triangle", color: "text-green-400" },
  { name: "Bluepeak", glyph: "circle", color: "text-green-400" },
  { name: "Helios", glyph: "hex", color: "text-green-400" },
  { name: "Arclight", glyph: "triangle", color: "text-green-400" },
  { name: "Monoline", glyph: "circle", color: "text-green-400" },
  { name: "Fjord & Co", glyph: "hex", color: "text-green-400" },
];

/* ----------------------------- Glyph ----------------------------- */

function Glyph({ kind, className }: { kind: GlyphKind; className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`size-4 shrink-0 ${className}`}
      aria-hidden
    >
      {kind === "circle" && <circle cx="12" cy="12" r="8" />}
      {kind === "triangle" && <path d="M12 4.5 20 19H4Z" />}
      {kind === "hex" && <path d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9Z" />}
    </svg>
  );
}

/* ---------------------------- Section ---------------------------- */

export default function LogoCloud() {
  return (
    <section
      aria-label="Trusted by teams"
      className="border-y border-white/5 bg-surface/30 py-14"
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <Reveal>
          <p className="text-center text-xs font-medium uppercase tracking-[0.25em] text-muted">
            Trusted by teams who live on the feed
          </p>
        </Reveal>

        <Reveal delay={0.15} className="mt-8">
          <Marquee speed={45}>
            {WORDMARKS.map((mark) => (
              <div
                key={mark.name}
                className="flex items-center gap-2.5 px-6 opacity-40 transition-opacity duration-300 hover:opacity-80"
              >
                <Glyph kind={mark.glyph} className={mark.color} />
                <span className="whitespace-nowrap font-display text-lg font-semibold text-foreground">
                  {mark.name}
                </span>
              </div>
            ))}
          </Marquee>
        </Reveal>
      </div>
    </section>
  );
}
