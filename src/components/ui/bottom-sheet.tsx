import { ReactNode } from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * THE bottom sheet for Juice — the one presentation for anything that slides up
 * from the bottom edge on iPhone (comments, city picker, composer, report/block
 * forms). Centered dialogs are reserved for AlertDialog confirmations only.
 *
 * System contract (see IPHONE_DESIGN_AUDIT.md):
 * - grabber + rounded-t-2xl + hairline border
 * - one scrim token: black/50 + blur
 * - safe-area bottom padding built in (footer or body, whichever is last)
 * - drag-to-dismiss via vaul; Escape/overlay-tap close for free
 * - `footer` renders pinned below the scroll area — put inputs there so the
 *   iOS keyboard pushes them up instead of covering them
 */
interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  /** Required for a11y (announced as the dialog title). */
  title: string;
  /** Optional line under the title (e.g. a story preview). */
  description?: string;
  /** Scrollable body. */
  children: ReactNode;
  /** Pinned above the home indicator / keyboard; not part of the scroll area. */
  footer?: ReactNode;
  /** "auto" hugs content (default); "tall" fixes the sheet at 85dvh for lists. */
  height?: "auto" | "tall";
  /** Set false to disable drag-to-dismiss (e.g. mid-upload). */
  dismissible?: boolean;
  className?: string;
}

const BottomSheet = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  height = "auto",
  dismissible = true,
  className,
}: BottomSheetProps) => (
  <DrawerPrimitive.Root
    open={open}
    onOpenChange={(o) => {
      if (!o) onClose();
    }}
    dismissible={dismissible}
    shouldScaleBackground={false}
  >
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
      <DrawerPrimitive.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full flex-col outline-none",
          "rounded-t-2xl border-t border-border bg-background sm:max-w-md",
          height === "tall" ? "h-[85dvh]" : "max-h-[90dvh]",
          className
        )}
      >
        {/* Grabber */}
        <div className="flex justify-center pt-2.5" aria-hidden="true">
          <span className="h-1 w-9 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-2 pl-4 pr-1 pt-1">
          <div className="min-w-0">
            <DrawerPrimitive.Title className="text-base font-semibold text-foreground">
              {title}
            </DrawerPrimitive.Title>
            {description && (
              <DrawerPrimitive.Description className="truncate text-xs text-muted-foreground">
                {description}
              </DrawerPrimitive.Description>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div
          className={cn(
            "flex-1 overflow-y-auto overscroll-contain",
            !footer && "pb-[env(safe-area-inset-bottom,0px)]"
          )}
        >
          {children}
        </div>

        {/* Pinned footer — rises with the iOS keyboard instead of hiding under it */}
        {footer && (
          <div className="border-t border-border px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
            {footer}
          </div>
        )}
      </DrawerPrimitive.Content>
    </DrawerPrimitive.Portal>
  </DrawerPrimitive.Root>
);

export default BottomSheet;
