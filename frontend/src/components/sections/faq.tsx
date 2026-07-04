"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { SectionHeading, GradientText } from "@/components/ui";
import { Stagger, StaggerItem, EASE } from "@/components/fx/motion";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Is this against LinkedIn's terms of service?",
    a: "CommentPilot is built ToS-first. Our servers never connect to LinkedIn - everything runs inside your own browser session, and today every comment is reviewed and posted by you with your own click. No shared passwords, no cloud automation touching your account.",
  },
  {
    q: "Will the comments sound robotic?",
    a: "No. The AI drafts from your tone and writing style, and every draft aims to add a specific insight, question, or experience - not generic praise. You can always edit before posting, and regenerate drafts you don't like.",
  },
  {
    q: "Does it comment automatically?",
    a: "Not yet - and that's deliberate. Right now you approve every comment, which keeps quality and safety at 100%. Full autopilot with human-like pacing is in development; Pro and Power subscribers get early access when it ships.",
  },
  {
    q: "Which platforms are supported?",
    a: "LinkedIn is live today via our Chrome extension. Reddit, X (Twitter), and AI auto-posting are coming soon and will be managed from the same dashboard.",
  },
  {
    q: "How does voice training work?",
    a: "You paste a few of your past posts or comments (or just describe your style), and the AI builds a voice profile it uses for every draft. The more you edit and approve, the sharper it gets.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes - one click from your dashboard, no emails, no retention calls. Every plan also starts with a 5-day free trial so you can prove the value first.",
  },
];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-28">
      <div className="mx-auto w-full max-w-3xl px-6">
        <SectionHeading
          eyebrow="FAQ"
          title={
            <>
              Questions, <GradientText>answered</GradientText>
            </>
          }
        />

        <Stagger className="mt-12 flex flex-col gap-4">
          {FAQS.map((item, i) => {
            const open = openIndex === i;
            return (
              <StaggerItem key={item.q}>
                <div className="glass rounded-2xl transition-colors duration-300 hover:border-white/20">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(open ? null : i)}
                    aria-expanded={open}
                    aria-controls={`faq-panel-${i}`}
                    className="flex w-full items-center justify-between gap-4 p-6 text-left text-[15px] font-semibold text-foreground"
                  >
                    <span>{item.q}</span>
                    <motion.span
                      animate={{ rotate: open ? 45 : 0 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className={`flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
                        open
                          ? "border-green-500/40 bg-green-500/15 text-green-300"
                          : "border-white/10 bg-white/[0.04] text-muted"
                      }`}
                      aria-hidden
                    >
                      <Plus className="size-4" />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        key="body"
                        id={`faq-panel-${i}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: EASE }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 text-[15px] leading-relaxed text-muted">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
