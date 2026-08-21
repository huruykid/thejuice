import type { ReactNode } from "react";
import { toast as sonnerToast } from "sonner";

/**
 * Sonner-backed adapter. The app renders ONE toast system — <Sonner /> mounted
 * in App.tsx — and this shim keeps the old shadcn call shape working:
 *
 *   const { toast } = useToast();
 *   toast({ title, description, variant: "destructive" });
 *
 * New code should `import { toast } from "sonner"` directly. The shadcn
 * toast/toaster UI (ui/toast.tsx, ui/toaster.tsx, ui/use-toast.ts) was deleted
 * in the design-system purge (IPHONE_DESIGN_AUDIT.md).
 */
interface LegacyToastOptions {
  title?: ReactNode;
  description?: ReactNode;
  variant?: "default" | "destructive";
  duration?: number;
}

function toast({ title, description, variant, duration }: LegacyToastOptions) {
  const message = title ?? description ?? "";
  const opts = {
    ...(title != null && description != null ? { description } : {}),
    ...(duration != null ? { duration } : {}),
  };
  return variant === "destructive"
    ? sonnerToast.error(message, opts)
    : sonnerToast(message, opts);
}

function useToast() {
  return { toast, dismiss: sonnerToast.dismiss };
}

export { useToast, toast };
