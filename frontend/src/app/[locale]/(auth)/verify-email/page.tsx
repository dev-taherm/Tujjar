"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/shared/ui";
import { authApi } from "@/api/queries";
import { useTranslations, useLocale } from "next-intl";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("auth.verifyEmail");
  const token = searchParams.get("token");

  const result = use(
    useMemo(() => {
      if (!token) return Promise.resolve({ ok: false, message: t("noToken") });
      return authApi
        .verifyEmail(token)
        .then(() => ({ ok: true, message: t("success") }))
        .catch(() => ({ ok: false, message: t("invalid") }));
    }, [token, t])
  );

  const status = result.ok ? ("success" as const) : ("error" as const);
  const message = result.message;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {status === "success" && (
            <Link
              href={`/${locale}/login`}
              className="text-sm text-primary-600 hover:underline"
            >
              Proceed to Sign In
            </Link>
          )}
          {status === "error" && (
            <Link
              href={`/${locale}/login`}
              className="text-sm text-primary-600 hover:underline"
            >
              Back to Sign In
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
