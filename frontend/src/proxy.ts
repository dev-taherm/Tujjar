import { NextRequest, NextResponse } from "next/server";

const LOCALES = ["en", "ar"];
const DEFAULT_LOCALE = "en";
const EXCLUDED_PREFIXES = ["/api", "/_next", "/favicon.ico", "/media"];

function getSubdomain(host: string): string | null {
  const hostname = host.split(":")[0];
  const parts = hostname.split(".");
  if (parts.length >= 2 && parts[parts.length - 1] === "localhost") {
    return parts[0];
  }
  return null;
}

function detectLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && LOCALES.includes(cookieLocale)) return cookieLocale;

  const acceptLanguage = request.headers.get("accept-language") || "";
  const preferred = acceptLanguage.split(",")[0]?.split("-")[0]?.trim();
  if (preferred && LOCALES.includes(preferred)) return preferred;

  return DEFAULT_LOCALE;
}

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const subdomain = getSubdomain(host);
  const pathname = request.nextUrl.pathname;

  const firstSegment = pathname.split("/")[1] || "";
  const hasLocalePrefix = LOCALES.includes(firstSegment);

  if (EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (subdomain) {
    const slug = subdomain;
    const locale = hasLocalePrefix ? firstSegment : detectLocale(request);
    const rest = hasLocalePrefix ? pathname.slice(`/${locale}`.length) : pathname;

    const shopPrefix = `/shop/${slug}`;
    const cleanRest = rest.startsWith(shopPrefix) ? rest.slice(shopPrefix.length) : rest;

    let pathSuffix = cleanRest === "/" ? "" : cleanRest;
    if (pathSuffix.startsWith("/blog")) {
      pathSuffix = `/shop${pathSuffix}`;
    }

    const newPath = `/shop/${slug}${pathSuffix}`;
    return NextResponse.rewrite(new URL(`/${locale}${newPath}`, request.url));
  }

  if (hasLocalePrefix) {
    return NextResponse.next();
  }

  const locale = detectLocale(request);
  return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
