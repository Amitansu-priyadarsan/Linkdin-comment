"use client";

import { Star } from "lucide-react";
import { GradientText, SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/fx/motion";
import { Marquee } from "@/components/fx/marquee";

type Testimonial = {
  name: string;
  role: string;
  initials: string;
  gradient: string;
  quote: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Maya Okafor",
    role: "Founder, PLG SaaS",
    initials: "MO",
    gradient: "from-green-600 to-green-700",
    quote:
      "Two of last month's demo calls started as comment threads CommentPilot drafted. Profile views are up 3.2x and I spend twelve minutes a day on LinkedIn instead of ninety.",
  },
  {
    name: "Daniel Reyes",
    role: "SDR Team Lead",
    initials: "DR",
    gradient: "from-green-700 to-green-400",
    quote:
      "My reps finally stopped posting 'Great insights!' under everything. Drafts come out in each rep's actual voice, and prospects reply. Meetings sourced from LinkedIn are up 40% this quarter.",
  },
  {
    name: "Priya Nair",
    role: "Fractional CMO",
    initials: "PN",
    gradient: "from-green-400 to-green-600",
    quote:
      "The post scoring is the sleeper feature. It surfaces the eight posts my ICP is actually reading, so every comment lands in front of buyers instead of engagement bait.",
  },
  {
    name: "Tom Vandermeer",
    role: "DevRel, dev-tools startup",
    initials: "TV",
    gradient: "from-green-600 to-green-700",
    quote:
      "It nails my tone — dry, slightly nerdy, zero exclamation marks. Developers can smell canned comments from orbit, and nobody has clocked a single draft yet.",
  },
  {
    name: "Alicia Fontaine",
    role: "Agency Owner",
    initials: "AF",
    gradient: "from-green-700 to-green-400",
    quote:
      "We used to block 90 minutes a day for founder-brand engagement. It's 15 now, and the comments are better. One thread turned into a $4k/month retainer.",
  },
  {
    name: "Marcus Bell",
    role: "Solo GTM Consultant",
    initials: "MB",
    gradient: "from-green-400 to-green-600",
    quote:
      "Two clients this quarter told me they'd read my comments for months before reaching out. CommentPilot kept me visible while I was heads-down delivering.",
  },
  {
    name: "Sofia Lindqvist",
    role: "Product Marketing Manager",
    initials: "SL",
    gradient: "from-green-600 to-green-700",
    quote:
      "I review, tweak a word or two, click, done. One-click fill sounds minor until you realize how much friction it removed — I actually show up every single day now.",
  },
  {
    name: "Jordan Achebe",
    role: "Technical Recruiter",
    initials: "JA",
    gradient: "from-green-700 to-green-400",
    quote:
      "Candidates recognize my name from the comments before I ever reach out. My InMail response rate went from 12% to 31% in six weeks.",
  },
  {
    name: "Elena Petrova",
    role: "Head of Growth",
    initials: "EP",
    gradient: "from-green-400 to-green-600",
    quote:
      "Everything runs in my own browser — their servers never touch LinkedIn. That architecture is the only reason I trusted it near my account. Three weeks in: zero warnings, 2,400 new profile views.",
  },
  {
    name: "Chris Donahue",
    role: "Founding AE",
    initials: "CD",
    gradient: "from-green-600 to-green-700",
    quote:
      "I fed it a handful of my old comments and now the drafts sound more like me than I do before coffee. I edit maybe one in five.",
  },
];

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <div className="glass flex w-[340px] shrink-0 flex-col gap-4 rounded-2xl p-6 sm:w-[380px]">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className={`flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${t.gradient} text-xs font-semibold tracking-wide text-white`}
        >
          {t.initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{t.name}</p>
          <p className="truncate text-xs text-muted">{t.role}</p>
        </div>
      </div>
      <div
        className="flex items-center gap-1"
        role="img"
        aria-label="Rated 5 out of 5 stars"
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} aria-hidden className="size-3.5 fill-amber-300 text-amber-300" />
        ))}
      </div>
      <blockquote className="text-sm leading-relaxed text-zinc-300">
        &ldquo;{t.quote}&rdquo;
      </blockquote>
    </div>
  );
}

export default function Testimonials() {
  const rowOne = TESTIMONIALS.slice(0, 5);
  const rowTwo = TESTIMONIALS.slice(5);

  return (
    <section id="testimonials" className="relative overflow-hidden py-28">
      <div className="mx-auto w-full max-w-6xl px-6">
        <SectionHeading
          eyebrow="Testimonials"
          title={
            <>
              Operators who <GradientText>stopped scrolling</GradientText>
            </>
          }
          subtitle="What happens when showing up daily stops costing two hours."
        />
      </div>

      <Reveal delay={0.1} className="mt-14 flex flex-col gap-6">
        <Marquee speed={55}>
          {rowOne.map((t) => (
            <TestimonialCard key={t.name} t={t} />
          ))}
        </Marquee>
        <Marquee speed={70} reverse>
          {rowTwo.map((t) => (
            <TestimonialCard key={t.name} t={t} />
          ))}
        </Marquee>
      </Reveal>
    </section>
  );
}
