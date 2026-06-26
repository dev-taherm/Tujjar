"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/shared/ui";
import { authApi } from "@/api/queries";
import { useTranslations, useLocale } from "next-intl";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("auth.verifyEmail");
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"verifying" | "success" | "error" | "no-token">(
    token ? "verifying" : "no-token"
  );
  const [message, setMessage] = useState(token ? "" : t("noToken"));

  useEffect(() => {
    if (!token) return;
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

  const resendSchema = z.object({ email: z.string().email(t("emailInvalid") || "Invalid email") });
  type ResendForm = z.infer<typeof resendSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResendForm>({ resolver: zodResolver(resendSchema) });

  const onResend = async (data: ResendForm) => {
    try {
      await authApi.resendVerification(data.email);
      toast.success(t("resent") || "Verification email sent. Please check your inbox.");
    } catch {
      toast.error(t("resendFailed") || "Failed to send verification email.");
    }
  };

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
        {(status === "no-token" || status === "error") && (
          <form onSubmit={handleSubmit(onResend)}>
            <CardFooter className="flex flex-col gap-3">
              <Input
                label={t("email") || "Email"}
                type="email"
                placeholder={t("emailPlaceholder") || "you@example.com"}
                error={errors.email?.message}
                {...register("email")}
              />
              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                {t("resend") || "Resend Verification Email"}
              </Button>
              <Link
                href={`/${locale}/login`}
                className="text-sm text-primary-600 hover:underline"
              >
                {t("backToLogin") || "Back to Sign In"}
              </Link>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
