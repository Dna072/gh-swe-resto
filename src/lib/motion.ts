import type { Transition, Variants } from "motion/react";

export const defaultTransition: Transition = {
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1],
};

export function revealVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      hidden: { opacity: 1, y: 0 },
      visible: { opacity: 1, y: 0 },
    };
  }
  return {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: defaultTransition },
  };
}

export function scalePopVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      rest: { scale: 1 },
      pressed: { scale: 1 },
    };
  }
  return {
    rest: { scale: 1 },
    pressed: { scale: 0.96, transition: { duration: 0.12 } },
  };
}

export const staggerChildren = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};
