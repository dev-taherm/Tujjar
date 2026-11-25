import * as React from "react";
import { cn } from "@/lib/utils";

/* Warm shimmer sweep (`.shimmer` in globals.css) instead of a gray pulse:
   shimmer reads as "loading", pulse reads as "broken". */
const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("shimmer rounded-md", className)} {...props} />
);

export { Skeleton };
