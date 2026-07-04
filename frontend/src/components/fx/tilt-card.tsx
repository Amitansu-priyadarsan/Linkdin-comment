"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import { useRef, type ReactNode } from "react";

/**
 * 3D hover-tilt card with a cursor-following background spotlight.
 * Give it rounded corners + `glass` styling via className.
 */
export function TiltCard({
  children,
  className = "",
  maxTilt = 7,
  spotlight = "rgba(124, 58, 237, 0.14)",
}: {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  spotlight?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const rx = useSpring(useMotionValue(0), { stiffness: 160, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 160, damping: 18 });
  const sx = useMotionValue(50);
  const sy = useMotionValue(50);
  const spot = useMotionTemplate`radial-gradient(420px circle at ${sx}% ${sy}%, ${spotlight}, transparent 65%)`;

  function onPointerMove(e: React.PointerEvent) {
    if (reduce || e.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    ry.set((px - 0.5) * 2 * maxTilt);
    rx.set(-(py - 0.5) * 2 * maxTilt);
    sx.set(px * 100);
    sy.set(py * 100);
  }

  function onPointerLeave() {
    rx.set(0);
    ry.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={{
        rotateX: rx,
        rotateY: ry,
        transformStyle: "preserve-3d",
        perspective: 900,
      }}
      whileHover={reduce ? undefined : { y: -6 }}
      transition={{ duration: 0.35 }}
      className={`group relative ${className}`}
    >
      <motion.div
        aria-hidden
        style={{ background: spot }}
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      {children}
    </motion.div>
  );
}
