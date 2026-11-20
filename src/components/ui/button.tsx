import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  // Kâğıt: dolu düğmeler mürekkep kenarlı karton + kesip yapıştırma gölgesi;
  // basınca gölge kapanıp kâğıt yerine oturur (bkz. globals.css `press`).
  primary:
    "bg-accent text-on-accent border-[1.5px] border-ink/80 shadow-sm hover:bg-accent-hover press",
  secondary:
    "bg-surface text-text-primary border-[1.5px] border-ink/70 shadow-sm hover:bg-surface-alt press",
  ghost: "bg-transparent text-text-primary hover:bg-surface-alt",
  danger: "bg-danger text-on-accent border-[1.5px] border-ink/80 shadow-sm hover:opacity-90 press",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-base",
  lg: "h-13 px-6 text-lg",
};

/** Shared with anywhere a Button's visual style is needed on a non-button
 * element (e.g. a Next.js `<Link>` CTA — nesting a real `<button>` inside an
 * `<a>` is invalid HTML/a11y, so those compose this instead of `<Button>`). */
export function buttonVariants(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return <button ref={ref} className={buttonVariants(variant, size, className)} {...props} />;
  },
);
Button.displayName = "Button";
