"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand";
import { PrimaryButton } from "@/components/ui";
import { EASE } from "@/components/fx/motion";

const LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Showcase", href: "#showcase" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
] as const;

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 24);
  });

  const solid = scrolled || open;

  const itemVariants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, x: -14 },
    show: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.45, ease: EASE },
    },
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`transition-all duration-300 ${
          solid
            ? "glass-deep border-b border-white/10"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <nav
          aria-label="Main"
          className={`mx-auto flex w-full max-w-6xl items-center justify-between px-6 transition-[height] duration-300 ${
            scrolled ? "h-14" : "h-16"
          }`}
        >
          <Logo />

          {/* Center links (desktop) */}
          <ul
            className="hidden items-center gap-1 md:flex"
            onMouseLeave={() => setHovered(null)}
          >
            {LINKS.map((link) => (
              <li key={link.href} className="relative">
                <Link
                  href={link.href}
                  onMouseEnter={() => setHovered(link.href)}
                  className="relative block px-3.5 py-2 text-sm font-medium text-muted transition-colors duration-200 hover:text-foreground"
                >
                  {link.label}
                  {hovered === link.href && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-3.5 bottom-0.5 h-px bg-gradient-to-r from-violet-500 to-cyan-400"
                      transition={
                        reduce
                          ? { duration: 0 }
                          : { duration: 0.35, ease: EASE }
                      }
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right actions (desktop) */}
          <div className="hidden items-center gap-5 md:flex">
            <Link
              href="/signin"
              className="text-sm font-medium text-muted transition-colors duration-200 hover:text-foreground"
            >
              Log in
            </Link>
            <PrimaryButton href="/signup" magnetic={false} className="px-5 py-2.5">
              Start free trial
            </PrimaryButton>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((prev) => !prev)}
            className="glass flex size-10 items-center justify-center rounded-xl text-foreground transition-colors duration-200 hover:bg-white/[0.08] md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </nav>
      </div>

      {/* Mobile panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: reduce ? 0 : 0.35, ease: EASE }}
            className="glass-deep overflow-hidden border-b border-white/10 md:hidden"
          >
            <motion.ul
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
              }}
              className="flex flex-col px-6 py-5"
            >
              {LINKS.map((link) => (
                <motion.li key={link.href} variants={itemVariants}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors duration-200 hover:bg-white/[0.05] hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}

              <motion.li variants={itemVariants}>
                <Link
                  href="/signin"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors duration-200 hover:bg-white/[0.05] hover:text-foreground"
                >
                  Log in
                </Link>
              </motion.li>

              <motion.li variants={itemVariants} className="pt-3">
                <div onClick={() => setOpen(false)}>
                  <PrimaryButton
                    href="/signup"
                    magnetic={false}
                    className="w-full px-5 py-2.5"
                  >
                    Start free trial
                  </PrimaryButton>
                </div>
              </motion.li>
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
