"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { revealVariants, staggerChildren } from "@/lib/motion";
import { cn } from "@/lib/utils";

const motionTags = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  li: motion.li,
  ul: motion.ul,
} as const;

export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: keyof typeof motionTags;
}) {
  const reduced = useReducedMotion() ?? false;
  const MotionTag = motionTags[as];

  return (
    <MotionTag
      className={cn(className)}
      variants={revealVariants(reduced)}
      initial={reduced ? "visible" : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.18, margin: "0px 0px -60px 0px" }}
      transition={reduced ? undefined : { delay }}
    >
      {children}
    </MotionTag>
  );
}

export function RevealGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion() ?? false;

  return (
    <motion.div
      className={cn(className)}
      variants={reduced ? undefined : staggerChildren}
      initial={reduced ? "visible" : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.12, margin: "0px 0px -40px 0px" }}
    >
      {children}
    </motion.div>
  );
}
