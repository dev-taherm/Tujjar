import * as React from "react";
import { cn } from "@/lib/utils";

const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("animate-pulse rounded-md bg-gray-200", className)} {...props} />
);

export { Skeleton };
