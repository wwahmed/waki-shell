import type { ReactNode } from "react";

export interface WakiShellFrameProps {
  header?: ReactNode;
  sidebar?: ReactNode;
  mobileNav?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  aside?: ReactNode;
  className?: string;
  contentClassName?: string;
  kiosk?: boolean;
}

/** Next-generation app frame for the material theme catalog.
 *  Old AppShell stays available; this frame is the gradual-adoption
 *  path for apps that want Waki theme surfaces to drive the chrome. */
export function WakiShellFrame({
  header,
  sidebar,
  mobileNav,
  children,
  footer,
  aside,
  className = "",
  contentClassName = "",
  kiosk = false,
}: WakiShellFrameProps) {
  if (kiosk) {
    return (
      <div className={`min-h-screen bg-transparent text-inherit ${className}`}>
        <main className={contentClassName}>{children}</main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-transparent text-inherit ${className}`}>
      {header}
      <div className="mx-auto grid min-h-screen w-full max-w-[1600px] grid-cols-1 gap-3 px-3 pb-24 pt-16 md:grid-cols-[minmax(220px,260px)_minmax(0,1fr)] md:pb-4 lg:grid-cols-[minmax(236px,280px)_minmax(0,1fr)_minmax(240px,320px)]">
        {sidebar && (
          <aside className="shell-sidebar sticky top-16 hidden max-h-[calc(100vh-5rem)] overflow-auto rounded-[var(--waki-radius)] p-3 md:block">
            {sidebar}
          </aside>
        )}
        <main className={`shell-main min-w-0 p-3 md:p-4 ${contentClassName}`}>{children}</main>
        {aside && (
          <aside className="glass sticky top-16 hidden max-h-[calc(100vh-5rem)] overflow-auto p-3 lg:block">
            {aside}
          </aside>
        )}
      </div>
      {mobileNav && <div className="fixed inset-x-3 bottom-3 z-40 md:hidden">{mobileNav}</div>}
      {footer}
    </div>
  );
}
