// Component re-exports. Consumers can import directly from this
// barrel, OR copy individual files out of src/components into their
// own tree (the v1 sync workflow is manual: `cp` the files once,
// then track waki-shell's CHANGELOG for updates).
export { Header } from "./components/Header";
export type { HeaderProps } from "./components/Header";
export { BottomTabNav } from "./components/BottomTabNav";
export type { BottomTabNavProps } from "./components/BottomTabNav";
export { Sidebar } from "./components/Sidebar";
export type { SidebarProps } from "./components/Sidebar";
export { AppShell } from "./components/AppShell";
export type { AppShellProps } from "./components/AppShell";
export { Splash } from "./components/Splash";
export type { SplashProps } from "./components/Splash";
export { UpdateBanner } from "./components/UpdateBanner";
export type { UpdateBannerProps } from "./components/UpdateBanner";
export { UserMenu } from "./components/UserMenu";
export type { UserMenuProps, User } from "./components/UserMenu";
export { EmptyState } from "./components/EmptyState";
export type { EmptyStateProps } from "./components/EmptyState";
export { LoadingSkeleton } from "./components/LoadingSkeleton";
export type { LoadingSkeletonProps } from "./components/LoadingSkeleton";
export { ErrorState } from "./components/ErrorState";
export type { ErrorStateProps } from "./components/ErrorState";

// Config re-exports for in-process use.
export { breakpoints } from "./config/breakpoints";
export { header } from "./config/header";
export { bottomTabNav } from "./config/bottomTabNav";
export { sidebar } from "./config/sidebar";
export { splash } from "./config/splash";
export { updateBanner } from "./config/updateBanner";
export { animations } from "./config/animations";
export { tapTargets } from "./config/tapTargets";
export { states } from "./config/states";
