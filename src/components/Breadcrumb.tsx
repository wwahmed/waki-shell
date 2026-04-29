import { Fragment, type ComponentType, type ReactNode } from "react";

/** Generic breadcrumb. Takes a list of items, renders separators
 *  between them, and truncates the middle on narrow viewports.
 *
 *  - Items with `href` render as anchor-styled links; without `href`
 *    they render as plain text (typical for the current page).
 *  - The last item is treated as the current location and gets
 *    `aria-current="page"`.
 *  - On mobile (`< sm`), middle items collapse to a single ellipsis
 *    so a long trail still fits the screen. The first and last
 *    items always render.
 *  - The chevron between items can be replaced via `Separator`. The
 *    default is a typographic right-pointing angle bracket so the
 *    shell doesn't ship its own icon dep.
 *
 *  Header / link rendering stays decoupled from any particular
 *  router by accepting a `LinkComponent` slot. When omitted, a
 *  plain `<a href>` is used.
 */

export interface BreadcrumbItem {
  label: ReactNode;
  href?: string;
  /** Optional icon to render to the left of the label. Lucide-style. */
  Icon?: ComponentType<{ className?: string }>;
}

export interface BreadcrumbProps {
  items: ReadonlyArray<BreadcrumbItem>;
  /** Custom separator element. Default is a small chevron glyph. */
  Separator?: ReactNode;
  /** Custom link component for router-aware navigation (e.g. NavLink
   *  from react-router). Receives `href` and `children`. */
  LinkComponent?: ComponentType<{ href: string; className?: string; children: ReactNode }>;
  className?: string;
  /** aria-label for the nav element. Default "Breadcrumb". */
  ariaLabel?: string;
}

const DefaultSeparator = (
  <span aria-hidden="true" className="text-slate-400 dark:text-slate-500 select-none">
    /
  </span>
);

const DefaultLink: ComponentType<{ href: string; className?: string; children: ReactNode }> = ({
  href,
  className,
  children,
}) => (
  <a href={href} className={className}>
    {children}
  </a>
);

export function Breadcrumb({
  items,
  Separator = DefaultSeparator,
  LinkComponent = DefaultLink,
  className = "",
  ariaLabel = "Breadcrumb",
}: BreadcrumbProps) {
  if (items.length === 0) return null;

  const renderItem = (item: BreadcrumbItem, index: number, isLast: boolean) => {
    const inner = (
      <span className="inline-flex items-center gap-1.5">
        {item.Icon && <item.Icon className="w-3.5 h-3.5 flex-shrink-0" />}
        <span className="truncate">{item.label}</span>
      </span>
    );

    if (isLast || !item.href) {
      return (
        <span
          key={index}
          aria-current={isLast ? "page" : undefined}
          className={`min-w-0 truncate ${
            isLast
              ? "text-strong font-semibold"
              : "text-subtle"
          }`}
        >
          {inner}
        </span>
      );
    }

    return (
      <LinkComponent
        key={index}
        href={item.href}
        className="min-w-0 truncate text-subtle hover:text-strong transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
      >
        {inner}
      </LinkComponent>
    );
  };

  return (
    <nav aria-label={ariaLabel} className={`text-sm ${className}`}>
      {/* Mobile: first ... last (or all if 2 or fewer) */}
      <ol className="flex items-center gap-2 sm:hidden">
        {items.length <= 2 ? (
          items.map((item, i) => (
            <Fragment key={i}>
              {i > 0 && <li aria-hidden="true">{Separator}</li>}
              <li className="min-w-0 max-w-[60vw]">
                {renderItem(item, i, i === items.length - 1)}
              </li>
            </Fragment>
          ))
        ) : (
          <>
            <li className="min-w-0 max-w-[40vw]">
              {renderItem(items[0], 0, false)}
            </li>
            <li aria-hidden="true">{Separator}</li>
            <li className="text-muted select-none" aria-label={`${items.length - 2} more`}>
              ...
            </li>
            <li aria-hidden="true">{Separator}</li>
            <li className="min-w-0 max-w-[40vw]">
              {renderItem(items[items.length - 1], items.length - 1, true)}
            </li>
          </>
        )}
      </ol>

      {/* Desktop: full trail */}
      <ol className="hidden sm:flex items-center gap-2">
        {items.map((item, i) => (
          <Fragment key={i}>
            {i > 0 && <li aria-hidden="true">{Separator}</li>}
            <li className="min-w-0 max-w-[28ch]">
              {renderItem(item, i, i === items.length - 1)}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}

/* Example:
 *
 * import { Breadcrumb } from "waki-shell";
 *
 * <Breadcrumb
 *   items={[
 *     { label: "Library", href: "/library" },
 *     { label: "Notes", href: "/library/notes" },
 *     { label: "2026-04-29 capture" },
 *   ]}
 * />
 */
