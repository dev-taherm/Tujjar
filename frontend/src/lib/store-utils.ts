"use client";

import { usePathname } from "next/navigation";

export function getSubdomain(host: string): string | null {
  const hostname = host.split(":")[0];
  const storeDomain = process.env.NEXT_PUBLIC_STORE_DOMAIN || "localhost";
  const baseDomain = storeDomain.startsWith(".") ? storeDomain.slice(1) : storeDomain;
  if (hostname.endsWith(`.${baseDomain}`)) {
    return hostname.slice(0, hostname.length - baseDomain.length - 1);
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
