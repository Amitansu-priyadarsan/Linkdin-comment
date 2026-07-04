"use client";

import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Soft green glow that trails the cursor across the whole page.
 * Disabled on touch devices and under prefers-reduced-motion.
 */
export function CursorGlow() {
  const reduce = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const x = useSpring(useMotionValue(-400), { stiffness: 90, damping: 20, mass: 0.6 });
  const y = useSpring(useMotionValue(-400), { stiffness: 90, damping: 20, mass: 0.6 });

  useEffect(() => {
    if (reduce) return;
    // Enable lazily from the event callback — only real mouse pointers count,
    // so touch devices never mount the glow.
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      setEnabled(true);
      x.set(e.clientX - 250);
      y.set(e.clientY - 250);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [reduce, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      style={{ x, y }}
      className="pointer-events-none fixed left-0 top-0 z-[5] size-[500px] rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.10),rgba(74,222,128,0.05)_45%,transparent_70%)] mix-blend-screen"
    />
  );
}
