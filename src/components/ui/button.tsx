import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.95] hover:scale-[1.02] cursor-pointer touch-manipulation",
  {
    variants: {
      variant: {
        default: "bg-gradient-primary text-primary-foreground hover:shadow-glow hover:scale-[1.02] transition-all duration-200 font-semibold active:scale-[0.95]",
        destructive: "bg-gradient-to-r from-destructive to-destructive-light text-destructive-foreground hover:shadow-lg hover:scale-[1.02] transition-all duration-200 active:scale-[0.95]",
        outline: "border border-border bg-background hover:bg-card-hover hover:border-primary/50 transition-all duration-200 active:scale-[0.95]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-[1.02] transition-all duration-200 active:scale-[0.95]",
        ghost: "hover:bg-muted/60 hover:text-foreground transition-all duration-200 active:scale-[0.95]",
        link: "text-primary underline-offset-4 hover:underline transition-all duration-200 active:scale-[0.95]",
        
        // Modern Instagram/Tinder-inspired variants
        gradient: "bg-gradient-primary text-primary-foreground hover:shadow-glow hover:scale-[1.02] transition-all duration-200 font-semibold rounded-2xl active:scale-[0.95]",
        "gradient-secondary": "bg-gradient-secondary text-white hover:shadow-lg hover:scale-[1.02] transition-all duration-200 font-medium rounded-2xl active:scale-[0.95]",
        success: "bg-gradient-success text-success-foreground hover:shadow-lg hover:scale-[1.02] transition-all duration-200 font-medium active:scale-[0.95]",
        
        // Juice App specific variants
        juice: "bg-gradient-primary text-primary-foreground hover:shadow-glow hover:scale-[1.02] transition-all duration-200 rounded-2xl font-semibold active:scale-[0.95]",
        "juice-soft": "bg-muted text-foreground hover:bg-primary/20 hover:text-foreground transition-all duration-200 rounded-xl active:scale-[0.95]",
        "juice-outline": "border-2 border-primary text-primary bg-background hover:bg-primary hover:text-primary-foreground transition-all duration-200 rounded-xl font-medium active:scale-[0.95]",
        
        // Interactive voting buttons
        "flag-green": "bg-success/10 border border-success/20 text-success hover:bg-success hover:text-white transition-all duration-200 rounded-full active:scale-[0.95]",
        "flag-red": "bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-all duration-200 rounded-full active:scale-[0.95]",
        
        // Glass effect buttons
        glass: "bg-white/10 backdrop-blur-lg border border-white/20 text-foreground hover:bg-white/20 transition-all duration-200 active:scale-[0.95]",
        "glass-dark": "bg-black/10 backdrop-blur-lg border border-black/20 text-foreground hover:bg-black/20 transition-all duration-200 active:scale-[0.95]",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 px-4 text-sm",
        lg: "h-14 px-8 text-base",
        xl: "h-16 px-12 text-lg",
        icon: "h-11 w-11",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-14 w-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
