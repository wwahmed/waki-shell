import type { ElementType, HTMLAttributes, ReactNode } from "react";

export type WakiSurfaceTone = "base" | "raised" | "bar" | "nested" | "main" | "sidebar" | "mobile";

export interface WakiSurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  tone?: WakiSurfaceTone;
  interactive?: boolean;
  children: ReactNode;
}

const toneClass: Record<WakiSurfaceTone, string> = {
  base: "glass",
  raised: "glass-elevated",
  bar: "glass-bar",
  nested: "panel-nested",
  main: "shell-main",
  sidebar: "shell-sidebar",
  mobile: "mobile-card",
};

/** Material-aware surface primitive for new Waki apps.
 *  It delegates the actual look to waki-themes, so a surface changes
 *  radius, blur, border, shadow, and hover treatment with the active
 *  material family. */
export function WakiSurface({
  as: Component = "section",
  tone = "base",
  interactive = false,
  className = "",
  children,
  ...props
}: WakiSurfaceProps) {
  return (
    <Component
      className={`${toneClass[tone]} ${interactive ? "transition-transform hover:-translate-y-0.5" : ""} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
