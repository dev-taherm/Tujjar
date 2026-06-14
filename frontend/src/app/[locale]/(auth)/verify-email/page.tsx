"use client";

import { useEffect, useState } from "react";
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
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage(t("noToken"));
      return;
    }

    authApi
      .verifyEmail(token)
      .then(() => {
        setStatus("success");
        setMessage(t("success"));
      })
      .catch(() => {
        setStatus("error");
        setMessage(t("invalid"));
      });
  }, [token, t]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {status === "loading" && (
            <p className="text-gray-500">{t("verifying")}</p>
          )}
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
