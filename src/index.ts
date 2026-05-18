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
export { ThemePickerOverlay } from "./components/ThemePickerOverlay";
export type {
  ThemePickerOverlayProps,
  ThemePickerThemeMeta,
  ThemePickerIcons,
  ThemeMode,
} from "./components/ThemePickerOverlay";
export { LookSwitcher } from "./components/LookSwitcher";
export type {
  LookSwitcherProps,
  LookSwitcherTheme,
  LookSwitcherIcons,
  LookSwitcherMode,
} from "./components/LookSwitcher";

// Next-generation shell family. These are additive and theme-contract
// first: they use waki-themes material classes instead of baking in a
// single app's chrome.
export { WakiShellFrame } from "./components/next/WakiShellFrame";
export type { WakiShellFrameProps } from "./components/next/WakiShellFrame";
export { WakiSurface } from "./components/next/WakiSurface";
export type { WakiSurfaceProps, WakiSurfaceTone } from "./components/next/WakiSurface";
export { WakiToolbar } from "./components/next/WakiToolbar";
export type { WakiToolbarProps } from "./components/next/WakiToolbar";

// v0.2.2 component additions: shadcn-style primitives + global
// surfaces (toast, error dialog, page transition, breadcrumb,
// tooltip, modal, spinner, badge).
export { Modal } from "./components/Modal";
export type { ModalProps, ModalSize } from "./components/Modal";
export { Spinner } from "./components/Spinner";
export type { SpinnerProps, SpinnerSize, SpinnerTone } from "./components/Spinner";
export { Badge } from "./components/Badge";
export type { BadgeProps, BadgeVariant, BadgeSize } from "./components/Badge";
export { Tooltip } from "./components/Tooltip";
export type { TooltipProps, TooltipSide } from "./components/Tooltip";
export { Breadcrumb } from "./components/Breadcrumb";
export type { BreadcrumbProps, BreadcrumbItem } from "./components/Breadcrumb";
export { PageTransition } from "./components/PageTransition";
export type {
  PageTransitionProps,
  PageTransitionDirection,
} from "./components/PageTransition";
export { Toaster, useToastContext } from "./components/Toaster";
export type {
  ToasterProps,
  ToastInput,
  ToastVariant,
  ToastRecord,
} from "./components/Toaster";
export {
  ErrorDialog,
  ErrorDialogProvider,
  useErrorDialogContext,
} from "./components/ErrorDialog";
export type {
  ErrorDialogProps,
  ErrorDialogProviderProps,
  ErrorDialogAction,
  ErrorDialogRequest,
} from "./components/ErrorDialog";

// Hook re-exports. Promoted in v0.2.0 from printer-dashboard;
// expanded in v0.2.2 with a handful of standard utility hooks.
export {
  useTheme,
  setTheme,
  toggleTheme,
  setThemeStorageKey,
} from "./hooks/useTheme";
export type { Theme } from "./hooks/useTheme";
export { useFullscreen } from "./hooks/useFullscreen";
export type { FullscreenApi } from "./hooks/useFullscreen";
export { useVersionWatcher } from "./hooks/useVersionWatcher";
export type { VersionWatcherState } from "./hooks/useVersionWatcher";
export { useMediaQuery } from "./hooks/useMediaQuery";
export { useDebounce } from "./hooks/useDebounce";
export { useLocalStorage } from "./hooks/useLocalStorage";
export { useToast } from "./hooks/useToast";
export { useErrorDialog } from "./hooks/useErrorDialog";

// Library re-exports. Version primitives the API helper / hook share.
export {
  setBuiltVersion,
  getBuiltVersion,
  setVersionEndpoint,
  setRefreshCooldownStorageKey,
  noteServerVersion,
  getLastServerVersion,
  subscribeServerVersion,
  fetchServerVersion,
  isVersionMismatch,
  markRefreshAttempt,
  isInRefreshCooldown,
  refreshCooldownRemainingMs,
  applyForceRefresh,
} from "./lib/version";
export type { ServerVersion } from "./lib/version";

// v0.2.2: centralised API client. Wires X-App-Version into the
// version watcher, handles 401-with-loginUrl auto-redirect, and
// surfaces a consistent ApiError shape with friendly messages.
export {
  createApiClient,
  consumePostLoginReturnPath,
  ApiError,
} from "./lib/api";
export type {
  ApiClient,
  ApiClientOptions,
  ApiRequestOptions,
  ApiKind,
} from "./lib/api";

// Vite plugin re-export. Consumers wire this into their
// vite.config.ts to bake __APP_VERSION__ + write dist/version.json.
export { versionPlugin } from "./vite/version-plugin";
export type { VersionPluginOptions } from "./vite/version-plugin";

// Config re-exports for in-process use.
export {
  HOSTNAMES,
  DEV_HOSTNAMES,
  INTERNAL_HOSTNAMES,
  ALL_HOSTNAMES,
  findHostnameEntry,
  findProdHostnameEntry,
  knownHostsSet,
  hostnamesForApp,
  hostnamesForPagesProject,
  allPagesProjects,
  sessionCookieNameForBrand,
  getCounterpartUrl,
  appIdentityMarker,
} from "./config/hostnames";
export type {
  AppKind,
  Brand,
  HostnameEntry,
  CounterpartResolution,
} from "./config/hostnames";
export { breakpoints } from "./config/breakpoints";
export { header } from "./config/header";
export { bottomTabNav } from "./config/bottomTabNav";
export { sidebar } from "./config/sidebar";
export { splash } from "./config/splash";
export { updateBanner } from "./config/updateBanner";
export { animations } from "./config/animations";
export { tapTargets } from "./config/tapTargets";
export { states } from "./config/states";
