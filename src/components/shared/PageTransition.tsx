import { type ReactNode } from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function PageTransition({ children }: { children: ReactNode }) {
  const prefersReduced = useReducedMotion();

  // Always use motion.div so AnimatePresence mode="wait" can detect
  // exit/enter transitions. With reduced motion, use a minimal duration
  // (0 can prevent completion callbacks from firing).
  const duration = prefersReduced ? 0.01 : 0.25;

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: prefersReduced ? 0 : -8 }}
      transition={{ duration, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}
