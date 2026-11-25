"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/shared/ui";
import { AuthShell } from "@/features/auth/auth-shell";
import { authApi } from "@/api/queries";
import { useAuthStore } from "@/stores";
import { useTranslations, useLocale } from "next-intl";

export default function RegisterPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("auth.register");
  const [error, setError] = useState<string | null>(null);

  const registerSchema = z
    .object({
      first_name: z.string().min(1, t("firstNameRequired")),
      last_name: z.string().min(1, t("lastNameRequired")),
      email: z.string().email(t("emailInvalid")),
      password: z.string().min(8, t("passwordMin")),
      password_confirm: z.string(),
    })
    .refine((data) => data.password === data.password_confirm, {
      message: t("passwordsNoMatch"),
      path: ["password_confirm"],
    });

  type RegisterForm = z.infer<typeof registerSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError(null);
      const result = await authApi.register(data);
      useAuthStore.getState().setUser(result.user);
      useAuthStore.getState().setTokens(result.tokens);
      router.push(`/${locale}/dashboard/onboarding`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      setError(axiosErr.response?.data?.error?.message || t("registrationFailed"));
    }
  };

  return (
    <AuthShell>
      <Card className="w-full animate-rise">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg bg-error-soft p-3 text-sm text-error">{error}</div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t("firstName")}
                placeholder="John"
                error={errors.first_name?.message}
                {...register("first_name")}
              />
              <Input
                label={t("lastName")}
                placeholder="Doe"
                error={errors.last_name?.message}
                {...register("last_name")}
              />
            </div>
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
            <Input
              label={t("confirmPassword")}
              type="password"
              placeholder="••••••••"
              error={errors.password_confirm?.message}
              {...register("password_confirm")}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              {t("createAccount")}
            </Button>
            <p className="text-center text-sm text-ink-soft">
              {t("hasAccount")}{" "}
              <Link href={`/${locale}/login`} className="text-primary-600 hover:underline">
                {t("signIn")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </AuthShell>
  );
}
