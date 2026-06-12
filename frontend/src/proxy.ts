import { NextRequest, NextResponse } from "next/server";

const EXCLUDED_PREFIXES = ["/login", "/register", "/dashboard", "/api", "/_next", "/favicon.ico"];

function getSubdomain(host: string): string | null {
  const hostname = host.split(":")[0];
  const parts = hostname.split(".");
  if (parts.length >= 2 && parts[parts.length - 1] === "localhost") {
    return parts[0];
  }
  return null;
}

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const subdomain = getSubdomain(host);
  const pathname = request.nextUrl.pathname;

  if (!subdomain) {
    return NextResponse.next();
  }

  if (EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const slug = subdomain;
  const newPath = pathname === "/" ? `/shop/${slug}` : `/shop/${slug}${pathname}`;

  return NextResponse.rewrite(new URL(newPath, request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
