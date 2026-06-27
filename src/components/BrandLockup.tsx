import { cn } from "@/lib/utils";

const LOGO = "/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png";

type Variant = "stacked" | "inline" | "mark";
type Size = "sm" | "md" | "lg";

const IMG: Record<Size, string> = { sm: "h-8 w-8", md: "h-14 w-14", lg: "h-16 w-16" };
const TXT: Record<Size, string> = { sm: "text-lg", md: "text-2xl", lg: "text-3xl sm:text-4xl" };

interface BrandLockupProps {
  /** "stacked" = logo above wordmark (full-page screens); "inline" = side by side (headers); "mark" = logo only. */
  variant?: Variant;
  size?: Size;
  className?: string;
}

/**
 * The single source of truth for the Juice logo + wordmark lockup.
 * Use this everywhere instead of hand-placing the image so the brand never drifts.
 * Wordmark is "The Juice App" with the amber (--primary) accent on "Juice".
 */
export const BrandLockup = ({ variant = "stacked", size = "md", className }: BrandLockupProps) => {
  const wordmark = (
    <span className={cn("font-bold tracking-tight text-foreground", TXT[size])}>
      The <span className="text-primary">Juice</span> App
    </span>
  );

  if (variant === "mark") {
    return <img src={LOGO} alt="The Juice App" className={cn(IMG[size], "object-contain", className)} />;
  }

  if (variant === "inline") {
    return (
      <span className={cn("inline-flex items-center gap-2", className)}>
        <img src={LOGO} alt="" aria-hidden className={cn(IMG[size], "object-contain")} />
        {wordmark}
      </span>
    );
  }

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <img src={LOGO} alt="" aria-hidden className={cn(IMG[size], "object-contain")} />
      {wordmark}
    </div>
  );
};

export default BrandLockup;
