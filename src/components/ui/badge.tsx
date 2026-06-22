import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary-light",
        secondary:
          "border-border bg-card text-muted-foreground hover:bg-card-hover",
        destructive:
          "border-transparent bg-destructive/15 text-destructive hover:bg-destructive/20",
        outline: "text-foreground",
        // Token-set badges used across the app shell.
        founding:
          "border-primary/30 bg-primary/10 text-primary",
        pending:
          "border-warning/30 bg-[hsl(var(--warning)/0.10)] text-[hsl(var(--warning))]",
        verified:
          "border-success/30 bg-success/10 text-success",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
