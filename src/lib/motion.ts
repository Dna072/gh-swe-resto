import type { Transition, Variants } from "motion/react";

export const defaultTransition: Transition = {
  duration: 0.55,
  ease: [0.22, 1, 0.36, 1],
};

export const editorialTransition: Transition = {
  duration: 0.8,
  ease: [0.16, 1, 0.3, 1],
};

export function revealVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      hidden: { opacity: 1, y: 0 },
      visible: { opacity: 1, y: 0 },
    };
  }
  return {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: editorialTransition },
  };
}

export function fadeVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      hidden: { opacity: 1 },
      visible: { opacity: 1 },
    };
  }
  return {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
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
    transition: { staggerChildren: 0.12, delayChildren: 0.08 },
  },
};

export const heroStagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.14, delayChildren: 0.2 },
  },
};
