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

  const onSubmit = async (data: LoginForm) => {
    try {
      setError(null);
      const result = await authApi.login(data.email, data.password);
      useAuthStore.getState().setUser(result.user);
      useAuthStore.getState().setTokens(result.tokens);
      toast.success(t("welcomeBack"));
      if (result.user.is_staff || result.user.is_superuser) {
        router.push(`/${locale}/admin`);
      } else {
        router.push(`/${locale}/dashboard`);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      setError(axiosErr.response?.data?.error?.message || t("loginFailed"));
    }
  };

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
