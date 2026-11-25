import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary-600 text-white shadow-sm hover:bg-primary-700 focus-visible:ring-primary-500",
        destructive: "bg-error text-white hover:opacity-90 focus-visible:ring-error",
        outline: "border border-line bg-panel text-ink hover:bg-rail focus-visible:ring-primary-500",
        secondary: "bg-rail text-ink hover:opacity-80 focus-visible:ring-primary-500",
        ghost: "text-ink-soft hover:bg-rail hover:text-ink focus-visible:ring-primary-500",
        link: "text-primary-600 underline-offset-4 hover:underline focus-visible:ring-primary-500",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

/*
 * Colors go through the token utilities (bg-primary-600 etc.). On storefront
 * pages the injected theme generates its own primary ramp, so buttons follow
 * the store's theme without any inline-style overrides — the old
 * `style={{ background: "var(--color-primary)" }}` hack is gone.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Spinner className="me-2 h-4 w-4" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
