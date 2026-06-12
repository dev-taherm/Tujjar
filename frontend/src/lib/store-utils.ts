"use client";

import { usePathname } from "next/navigation";

export function getSubdomain(host: string): string | null {
  const hostname = host.split(":")[0];
  const parts = hostname.split(".");
  if (parts.length >= 2 && parts[parts.length - 1] === "localhost") {
    return parts[0];
  }
  return null;
}

export function isExcludedPath(pathname: string): boolean {
  const excluded = ["/login", "/register", "/dashboard", "/api", "/_next", "/favicon.ico"];
  return excluded.some((p) => pathname.startsWith(p));
}

export function useStoreSlug(): string | null {
  if (typeof window === "undefined") return null;
  return getSubdomain(window.location.hostname);
}
