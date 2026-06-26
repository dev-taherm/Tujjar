"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/shared/ui";
import { authApi } from "@/api/queries";
import { useTranslations, useLocale } from "next-intl";

export default function ResetPasswordPage() {
  const locale = useLocale();
  const t = useTranslations("auth.resetPassword");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [submitted, setSubmitted] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Request Reset Form (no token) ---
  const requestResetSchema = z.object({
    email: z.string().email(t("emailInvalid")),
  });
  type RequestResetForm = z.infer<typeof requestResetSchema>;

  const {
    register: registerRequest,
    handleSubmit: handleSubmitRequest,
    formState: { errors: requestErrors, isSubmitting: requestSubmitting },
  } = useForm<RequestResetForm>({
    resolver: zodResolver(requestResetSchema),
  });

  const onRequestReset = async (data: RequestResetForm) => {
    try {
      setError(null);
      await authApi.requestPasswordReset(data.email);
      setSubmitted(true);
    } catch {
      setError(t("error"));
    }
  };

  // --- Confirm Reset Form (has token) ---
  const confirmResetSchema = z
    .object({
      password: z.string().min(8, t("passwordMin") || "Password must be at least 8 characters"),
      password_confirm: z.string(),
    })
    .refine((data) => data.password === data.password_confirm, {
      message: t("passwordsNoMatch") || "Passwords do not match",
      path: ["password_confirm"],
    });
  type ConfirmResetForm = z.infer<typeof confirmResetSchema>;

  const {
    register: registerConfirm,
    handleSubmit: handleSubmitConfirm,
    formState: { errors: confirmErrors, isSubmitting: confirmSubmitting },
  } = useForm<ConfirmResetForm>({
    resolver: zodResolver(confirmResetSchema),
  });

  const onConfirmReset = async (data: ConfirmResetForm) => {
    try {
      setError(null);
      await authApi.resetPassword(token!, data.password, data.password_confirm);
      setResetSuccess(true);
    } catch {
      setError(t("invalidToken") || "Invalid or expired reset link.");
    }
  };

  // --- Success state after requesting reset ---
  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("checkEmail")}</CardTitle>
            <CardDescription>{t("checkEmailDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link
              href={`/${locale}/login`}
              className="text-sm text-primary-600 hover:underline"
            >
              {t("backToLogin") || "Back to Sign In"}
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Success state after password reset ---
  if (resetSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("resetSuccess") || "Password Reset Successfully"}</CardTitle>
            <CardDescription>
              {t("resetSuccessDescription") || "Your password has been reset. You can now sign in with your new password."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link
              href={`/${locale}/login`}
              className="text-sm text-primary-600 hover:underline"
            >
              {t("proceedToSignIn") || "Proceed to Sign In"}
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Confirm Reset Form (token present) ---
  if (token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("title")}</CardTitle>
            <CardDescription>
              {t("confirmSubtitle") || "Enter your new password below."}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmitConfirm(onConfirmReset)}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              <Input
                label={t("newPassword") || "New Password"}
                type="password"
                placeholder="••••••••"
                error={confirmErrors.password?.message}
                {...registerConfirm("password")}
              />
              <Input
                label={t("confirmPassword") || "Confirm Password"}
                type="password"
                placeholder="••••••••"
                error={confirmErrors.password_confirm?.message}
                {...registerConfirm("password_confirm")}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" isLoading={confirmSubmitting}>
                {t("resetPassword") || "Reset Password"}
              </Button>
              <Link
                href={`/${locale}/login`}
                className="text-center text-sm text-gray-500 hover:underline"
              >
                {t("backToLogin") || "Back to Sign In"}
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  // --- Request Reset Form (no token) ---
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmitRequest(onRequestReset)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <Input
              label={t("email")}
              type="email"
              placeholder={t("emailPlaceholder")}
              error={requestErrors.email?.message}
              {...registerRequest("email")}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" isLoading={requestSubmitting}>
              {t("sendResetLink")}
            </Button>
            <Link
              href={`/${locale}/login`}
              className="text-center text-sm text-gray-500 hover:underline"
            >
              {t("backToLogin") || "Back to Sign In"}
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
