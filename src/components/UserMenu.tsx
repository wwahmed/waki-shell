import { useEffect, useRef, useState } from "react";

/** Tap-the-avatar-for-an-account-menu pattern. Shows the avatar as a
 *  tappable trigger; on tap, opens a popover (desktop) or full-width
 *  sheet (mobile, < sm) with the user's name + email and a danger-
 *  styled Sign out item.
 *
 *  Originally extracted from printer-dashboard's Header.tsx UserMenu
 *  (v0.14.6). Refactored to take the user data + sign-out URL as
 *  props so the same shape works across apps with different auth
 *  endpoints. The avatar circle (with image-load fallback to
 *  initials) is delegated to the consuming app via the `avatar` slot
 *  so that branding (ring colours, fallback typography) can vary
 *  per app while the menu UX stays uniform. */
export interface User {
  name?: string | null;
  email?: string | null;
  picture?: string | null;
}

export interface UserMenuProps {
  user: User;
  /** Pre-rendered avatar element. The trigger and the menu header
   *  both display it, so the host can choose a "small" variant for
   *  the trigger and a "large" variant for the header — pass either
   *  one element used in both places, or a render function. */
  avatar: React.ReactNode | ((variant: "trigger" | "header") => React.ReactNode);
  /** Backend logout URL. Rendered as a top-level <a> (not a SPA
   *  link) so the session is destroyed server-side before the
   *  redirect lands. Default `/auth/logout`. */
  signOutHref?: string;
  /** Lucide-style icon for the Sign out item. */
  LogOutIcon: React.ComponentType<{ className?: string }>;
  /** Closes the menu when this changes (e.g. route change). Optional. */
  closeKey?: string | number;
  /** Extra menu items rendered between the user header and Sign out. */
  extraItems?: React.ReactNode;
}

const DEFAULT_SIGN_OUT_HREF = "/auth/logout";

export function UserMenu({
  user,
  avatar,
  signOutHref = DEFAULT_SIGN_OUT_HREF,
  LogOutIcon,
  closeKey,
  extraItems,
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const displayName = user.name || user.email || "Signed in";

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Close when the host signals a navigation / page change.
  useEffect(() => {
    setOpen(false);
  }, [closeKey]);

  const triggerAvatar = typeof avatar === "function" ? avatar("trigger") : avatar;
  const headerAvatar = typeof avatar === "function" ? avatar("header") : avatar;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Account menu — signed in as ${displayName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        title={displayName}
        className="flex-shrink-0 w-11 h-11 rounded-full inline-flex items-center justify-center hover:bg-slate-200/60 dark:hover:bg-slate-700/50 transition-colors"
      >
        {triggerAvatar}
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm sm:hidden animate-overlayIn motion-reduce:animate-none"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="
              fixed left-2 right-2 top-[3.75rem] z-50
              sm:absolute sm:inset-auto sm:left-auto sm:right-0 sm:top-full sm:mt-1 sm:w-64
              rounded-xl border border-slate-200 dark:border-slate-700
              bg-white dark:bg-slate-800 shadow-xl shadow-slate-300/40 dark:shadow-black/50
              overflow-hidden animate-modalIn motion-reduce:animate-none
            "
          >
            <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-200 dark:border-slate-700">
              {headerAvatar}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {user.name || "Signed in"}
                </div>
                {user.email && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user.email}
                  </div>
                )}
              </div>
            </div>
            {extraItems}
            <a
              href={signOutHref}
              role="menuitem"
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <LogOutIcon className="w-4 h-4" />
              <span>Sign out</span>
            </a>
          </div>
        </>
      )}
    </div>
  );
}
