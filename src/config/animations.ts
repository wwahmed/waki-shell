/** Animation tokens shared across shell components. Each entry
 *  documents the CSS keyframe + class name the consuming app's CSS
 *  needs to define for the matching component to animate. The shell
 *  components reference the class names directly (e.g.
 *  `animate-modalIn`); the consuming app must ship those rules in
 *  its global stylesheet. printer-dashboard's index.css is the
 *  reference implementation. */
export const animations = {
  fadeIn: { className: "animate-fadeIn", durationMs: 180, easing: "ease-out" },
  fadeInUp: { className: "animate-fadeInUp", durationMs: 200, easing: "ease-out" },
  modalIn: { className: "animate-modalIn", durationMs: 180, easing: "ease-out" },
  overlayIn: { className: "animate-overlayIn", durationMs: 150, easing: "ease-out" },
  toastIn: { className: "animate-toastIn", durationMs: 180, easing: "ease-out" },
  cardIn: { className: "animate-cardIn", durationMs: 220, easing: "ease-out" },
  shimmer: { className: "animate-shimmer", durationMs: 1600, easing: "ease-in-out", loop: true },
  splashBounce: { className: "animate-splashBounce", durationMs: 1200, easing: "ease-in-out", loop: true },
  /** Stagger helper: cards in a list each delay a hair more than
   *  the last. Use as `animate-cardIn stagger-{n}` (n=0..7). After
   *  7, fall back to no delay so very long lists don't pile up
   *  perceivable lag. */
  staggerSteps: 8,
  staggerDelayMs: 40,
  /** All shell animations opt out under prefers-reduced-motion. */
  respectsReducedMotion: true,
} as const;
