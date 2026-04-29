import { useErrorDialogContext } from "../components/ErrorDialog";

/** `useErrorDialog` is the consumer-facing hook for the
 *  `<ErrorDialogProvider>` mounted near the app root.
 *
 *  Returns `{ showError, dismiss }`:
 *  - `showError({ title, description, code, primaryAction, secondaryAction })`
 *    enqueues a modal error dialog. Calls are serialised so the
 *    second error queues behind the first.
 *  - `dismiss()` closes the current dialog.
 *
 *  Throws if called outside of an `<ErrorDialogProvider>`.
 */
export function useErrorDialog() {
  return useErrorDialogContext();
}

export type {
  ErrorDialogProps,
  ErrorDialogAction,
  ErrorDialogRequest,
} from "../components/ErrorDialog";

/* Example:
 *
 * import { useErrorDialog } from "waki-shell";
 *
 * function DeleteButton({ id }: { id: string }) {
 *   const { showError } = useErrorDialog();
 *   const onDelete = async () => {
 *     try {
 *       await api.delete(`/items/${id}`);
 *     } catch (err) {
 *       showError({
 *         title: "Could not delete item",
 *         description: (err as Error).message,
 *         code: "HTTP 500",
 *         primaryAction: { label: "Retry", onClick: () => onDelete() },
 *         secondaryAction: { label: "Dismiss" },
 *       });
 *     }
 *   };
 *   return <button onClick={onDelete}>Delete</button>;
 * }
 */
