import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LandingPage } from "@/features/landing/landing-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing");
  return {
    title: `Tujjar — ${t("subtitle")}`,
    description: t("description"),
  };
}

export default function HomePage() {
  return <LandingPage />;
}
