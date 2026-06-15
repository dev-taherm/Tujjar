"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/shared/ui";
import { authApi } from "@/api/queries";
import { useAuthStore } from "@/stores";
import { useTranslations, useLocale } from "next-intl";

export default function LoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("auth.login");
  const [error, setError] = useState<string | null>(null);
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorSessionToken, setTwoFactorSessionToken] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState("");
  const [is2FASubmitting, setIs2FASubmitting] = useState(false);

  const loginSchema = z.object({
    email: z.string().email(t("emailInvalid")),
    password: z.string().min(8, t("passwordMin")),
  });

  type LoginForm = z.infer<typeof loginSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const handleLoginSuccess = async (user: any, tokens: any) => {
    useAuthStore.getState().setUser(user);
    useAuthStore.getState().setTokens(tokens);
    try {
      const { data: orgs } = await import("@/api/client").then(m => m.apiClient.get("/organizations/"));
      const orgList = Array.isArray(orgs) ? orgs : orgs?.results || [];
      if (orgList.length > 0) {
        useAuthStore.getState().setOrganization(orgList[0]);
        const { data: members } = await import("@/api/client").then(m => m.apiClient.get(`/organizations/${orgList[0].id}/members/`));
        const memberList = Array.isArray(members) ? members : [];
        const myMembership = memberList.find((m: any) => m.user === user.id);
        if (myMembership) {
          useAuthStore.getState().setRole(myMembership.role_name);
        }
      }
    } catch {}
    toast.success(t("welcomeBack"));
    if (user.is_staff || user.is_superuser) {
      router.push(`/${locale}/admin`);
    } else {
      router.push(`/${locale}/dashboard`);
    }
  };

  const onSubmit = async (data: LoginForm) => {
    try {
      setError(null);
      const result = await authApi.login(data.email, data.password);
      if (result.requires_2fa) {
        setRequires2FA(true);
        setTwoFactorSessionToken(result.two_factor_session_token || "");
        return;
      }
      await handleLoginSuccess(result.user, result.tokens);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      setError(axiosErr.response?.data?.error?.message || t("loginFailed"));
    }
  };

  const handle2FASubmit = async () => {
    setIs2FASubmitting(true);
    setError(null);
    try {
      let result;
      if (useBackupCode) {
        result = await authApi.login2FAWithBackup(twoFactorSessionToken, backupCode);
      } else {
        result = await authApi.login2FA(twoFactorSessionToken, twoFactorCode);
      }
      await handleLoginSuccess(result.user, result.tokens);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.response?.data?.code?.[0] || err?.response?.data?.backup_code?.[0] || t("loginFailed");
      setError(detail);
    } finally {
      setIs2FASubmitting(false);
    }
  };

  if (requires2FA) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{useBackupCode ? t("backupCodeTitle") : t("twoFactorTitle")}</CardTitle>
            <CardDescription>{useBackupCode ? t("backupCodeDescription") : t("twoFactorDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}
            {useBackupCode ? (
              <Input
                label={t("backupCode")}
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value)}
                placeholder="xxxxxxxx"
              />
            ) : (
              <Input
                label={t("verificationCode")}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
              />
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              className="w-full"
              onClick={handle2FASubmit}
              isLoading={is2FASubmitting}
              disabled={useBackupCode ? !backupCode : twoFactorCode.length !== 6}
            >
              {t("verify")}
            </Button>
            <button
              type="button"
              onClick={() => { setUseBackupCode(!useBackupCode); setError(null); }}
              className="text-sm text-primary-600 hover:underline"
            >
              {useBackupCode ? t("useAuthenticator") : t("useBackupCode")}
            </button>
            <button
              type="button"
              onClick={() => { setRequires2FA(false); setTwoFactorCode(""); setBackupCode(""); setError(null); }}
              className="text-sm text-gray-500 hover:underline"
            >
              {t("backToLogin")}
            </button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}
            <Input
              label={t("email")}
              type="email"
              placeholder={t("emailPlaceholder")}
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label={t("password")}
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password")}
            />
            <div className="flex items-center justify-between text-sm">
              <Link href={`/${locale}/reset-password`} className="text-primary-600 hover:underline">
                {t("forgotPassword")}
              </Link>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              {t("signIn")}
            </Button>
            <p className="text-center text-sm text-gray-500">
              {t("noAccount")}{" "}
              <Link href={`/${locale}/register`} className="text-primary-600 hover:underline">
                {t("signUp")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
