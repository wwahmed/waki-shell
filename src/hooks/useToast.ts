import { useToastContext } from "../components/Toaster";

/** `useToast` is the consumer-facing hook for the Toaster system.
 *  Returns the same `{ toast, dismiss, clear }` triplet that the
 *  provider exposes; the indirection exists so consumers can write
 *  `import { useToast } from "waki-shell"` without reaching into
 *  the component file.
 *
 *  Usage:
 *    const { toast, dismiss } = useToast();
 *    toast({ title: "Saved", variant: "success" });
 *    toast({ title: "Failed", description: "Network error", variant: "danger", duration: 0 });
 *
 *  Throws if called outside of a `<Toaster>` provider.
 */
export function useToast() {
  return useToastContext();
}

export type { ToastInput, ToastVariant, ToastRecord } from "../components/Toaster";

/* Example:
 *
 * import { useToast } from "waki-shell";
 *
 * function PublishButton() {
 *   const { toast } = useToast();
 *   return (
 *     <button
 *       onClick={async () => {
 *         try {
 *           await publish();
 *           toast({ title: "Published", variant: "success" });
 *         } catch (err) {
 *           toast({
 *             title: "Publish failed",
 *             description: (err as Error).message,
 *             variant: "danger",
 *             duration: 0,
 *           });
 *         }
 *       }}
 *     >
 *       Publish
 *     </button>
 *   );
 * }
 */
