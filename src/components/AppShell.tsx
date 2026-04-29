import type { ReactNode } from "react";

/** Convenience layout shell that composes Header / Sidebar /
 *  BottomTabNav around the app's main content. Apps that want a
 *  custom layout can skip this and use the individual components
 *  directly.
 *
 *  Default geometry matches printer-dashboard:
 *  - h-14 fixed top header
 *  - main content gets `pt-14 pb-24 md:pb-0` so it clears the
 *    header and the mobile bottom bar
 *  - kiosk mode hides every chrome and lets main fill the screen */
export interface AppShellProps {
  header?: ReactNode;
  sidebar?: ReactNode;
  bottomTabNav?: ReactNode;
  children: ReactNode;
  /** Kiosk / fullscreen mode: hide all chrome, render children
   *  edge-to-edge. */
  kiosk?: boolean;
  /** Optional pre-content slot (typically a Breadcrumb). */
  preContent?: ReactNode;
  /** Optional post-content slot (typically Toaster + ErrorDialog). */
  postContent?: ReactNode;
}

export function AppShell({
  header,
  sidebar,
  bottomTabNav,
  children,
  kiosk = false,
  preContent,
  postContent,
}: AppShellProps) {
  if (kiosk) {
    return (
      <div className="min-h-full flex flex-col">
        <main className="flex-1">{children}</main>
        {postContent}
      </div>
    );
  }
  return (
    <div className="min-h-full flex">
      {sidebar}
      <div className="flex-1 flex flex-col min-w-0">
        {header}
        <main className={`flex-1 ${header ? "pt-14" : ""} ${bottomTabNav ? "pb-24 md:pb-0" : ""}`}>
          {preContent}
          {children}
        </main>
        {bottomTabNav}
      </div>
      {postContent}
    </div>
  );
}
