import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Providers } from "@/providers";
import { Toaster } from "sonner";
import "../globals.css";

/*
 * Brand fonts (IBM Plex Sans Arabic / Fraunces / Reem Kufi) are
 * self-hosted: @font-face rules live in src/app/fonts.css, served from
 * frontend/public/fonts. This keeps builds offline-reproducible — no
 * fonts.googleapis.com dependency at build or runtime.
 */

export const metadata: Metadata = {
  title: "Tujjar - AI Marketplace Platform",
  description: "Build, customize, and scale your online store with AI-powered tools",
};

/* Applies the dashboard theme before first paint (no flash, no CLS).
   Storefronts run their own script (shop layout) keyed on
   'tujjar-dark-mode'; this one governs the app shell and defaults to the
   OS preference until the user picks explicitly. */
const themeInitScript = `(function(){try{var t=localStorage.getItem('tujjar-dashboard-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <Providers>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
            <Toaster theme="system" />
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}
