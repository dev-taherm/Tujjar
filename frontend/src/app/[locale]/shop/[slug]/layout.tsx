import type { Metadata } from "next";
import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import {
  getStore,
  resolveSeoTitle,
  storefrontUrl,
} from "@/lib/server/storefront-api";
import { buildThemeCss } from "@/lib/theme-css";
import { StorefrontChrome } from "@/features/storefront/chrome";

function getSubdomainFromHost(host: string): string | null {
  const hostname = host.split(":")[0];
  const storeDomain = process.env.NEXT_PUBLIC_STORE_DOMAIN || "localhost";
  const baseDomain = storeDomain.startsWith(".") ? storeDomain.slice(1) : storeDomain;
  if (hostname.endsWith(`.${baseDomain}`)) {
    return hostname.slice(0, hostname.length - baseDomain.length - 1);
  }
  return null;
}

function resolveGoogleFontsHref(theme: NonNullable<Awaited<ReturnType<typeof getStore>>>["theme_config"]): string | null {
  if (!theme?.typography) return null;
  const fonts = new Set<string>();
  if (theme.typography.headingFont && !theme.typography.headingFont.startsWith("system")) {
    fonts.add(theme.typography.headingFont);
  }
  if (theme.typography.bodyFont && !theme.typography.bodyFont.startsWith("system")) {
    fonts.add(theme.typography.bodyFont);
  }
  if (fonts.size === 0) return null;
  const families = [...fonts]
    .map((font) => `family=${encodeURIComponent(font)}:wght@400;500;600;700`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const store = await getStore(slug, locale);
  if (!store) return {};

  // Turn the store's SEO title template into a Next.js title template so
  // child pages ("Product X") render as "{{page_title}} | {{store_name}}".
  const rawTemplate = store.seo_title || "";
  const titleTemplate = rawTemplate.includes("{{page_title}}")
    ? rawTemplate
        .replace(/\{\{page_title\}\}/g, "%s")
        .replace(/\{\{store_name\}\}/g, store.name)
    : `%s | ${store.name}`;

  const description = store.seo_description || store.description || "";
  const ogImages = store.og_image ? [store.og_image] : [];

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    title: {
      default: resolveSeoTitle(store.seo_title, "Home", store.name),
      template: titleTemplate,
    },
    description,
    alternates: {
      canonical: storefrontUrl(slug, "", locale),
      languages: {
        en: storefrontUrl(slug, "", "en"),
        ar: storefrontUrl(slug, "", "ar"),
      },
    },
    openGraph: {
      title: store.name,
      description,
      url: storefrontUrl(slug, "", locale),
      siteName: store.name,
      images: ogImages,
      locale: locale === "ar" ? "ar" : "en",
      alternateLocale: locale === "ar" ? ["en"] : ["ar"],
      type: "website",
    },
    twitter: {
      card: (store.twitter_card as "summary" | "summary_large_image") || "summary_large_image",
      title: store.name,
      description,
      images: ogImages,
    },
    icons: store.favicon_url ? { icon: store.favicon_url } : undefined,
  };
}

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const host = (await headers()).get("host") || "";
  const isSubdomain = !!getSubdomainFromHost(host);
  const store = await getStore(slug, locale);

  if (!store) {
    const t = await getTranslations({ locale, namespace: "storefront.notFound" });
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>{t("title")}</h1>
        <p className="mt-2" style={{ color: "var(--color-text-secondary)" }}>{t("description")}</p>
      </div>
    );
  }

  const themeCss = buildThemeCss(store.theme_config);
  const customCss = store.theme_assets?.custom_css || "";
  const fontsHref = resolveGoogleFontsHref(store.theme_config);
  const darkMode = store.theme_config?.darkMode;

  // Apply the dark-mode class before first paint: localStorage wins, else the
  // theme default. When the theme has no dark mode, keep the document light.
  const darkInitScript = darkMode?.enabled
    ? `(function(){try{var s=localStorage.getItem('tujjar-dark-mode');var want=s!==null?s==='true':${!!darkMode.default};document.documentElement.classList.toggle('dark',want);}catch(e){}})();`
    : `(function(){try{document.documentElement.classList.remove('dark');}catch(e){}})();`;

  return (
    <>
      {themeCss ? <style id="storefront-theme" dangerouslySetInnerHTML={{ __html: themeCss }} /> : null}
      {customCss ? <style id="storefront-custom-css" dangerouslySetInnerHTML={{ __html: customCss }} /> : null}
      {fontsHref ? <link rel="stylesheet" href={fontsHref} /> : null}
      <script dangerouslySetInnerHTML={{ __html: darkInitScript }} />
      <StorefrontChrome store={store} slug={slug} isSubdomain={isSubdomain}>
        {children}
      </StorefrontChrome>
    </>
  );
}
