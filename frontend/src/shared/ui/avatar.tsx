import { cn } from "@/lib/utils";

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-7 w-7 text-[10px] rounded-lg",
  md: "h-9 w-9 text-xs rounded-lg",
  lg: "h-12 w-12 text-sm rounded-xl",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("") || "?";
}

/**
 * Initials avatar with the sienna→amber gradient fallback.
 */
export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name}
        className={cn("object-cover", sizeClasses[size], className)}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex items-center justify-center font-bold text-white",
        "bg-gradient-to-br from-primary-400 to-accent-500",
        sizeClasses[size],
        className
      )}
    >
      {initials(name)}
    </span>
  );
}
