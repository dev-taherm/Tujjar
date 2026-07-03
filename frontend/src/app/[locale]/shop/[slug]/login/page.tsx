"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/shared/ui";
import { customerAuthApi } from "@/api/customer-auth";
import { useCustomerAuthStore } from "@/stores/customer-auth";
import { useGuestCartStore } from "@/stores/guest-cart";
import { customerClient } from "@/api/customer-client";

export default function StorefrontLoginPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const slug = params.slug as string;
  const t = useTranslations("auth.login");
  const [error, setError] = useState<string | null>(null);

  const loginSchema = z.object({
    email: z.string().email(t("emailInvalid")),
    password: z.string().min(1, t("passwordRequired")),
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
      const result = await customerAuthApi.login(slug, {
        email: data.email,
        password: data.password,
      });
      useCustomerAuthStore.getState().setCustomer(result.customer);
      useCustomerAuthStore.getState().setTokens(result.tokens);

      // Merge guest cart into backend cart (fire-and-forget, don't block navigation)
      const guestItems = useGuestCartStore.getState().items;
      useGuestCartStore.getState().clearCart();
      if (guestItems.length > 0) {
        customerClient.post("/customers/auth/merge-cart/", {
          store: slug,
          items: guestItems.map((item) => ({
            product: item.productId,
            variant: item.variantId || undefined,
            quantity: item.quantity,
          })),
        }).catch(() => {});
      }

      toast.success(t("welcomeBack"));
      router.push(`/${locale}/shop/${slug}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || t("loginFailed"));
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
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              {t("signIn")}
            </Button>
            <p className="text-center text-sm text-gray-500">
              {t("noAccount")}{" "}
              <Link href={`/${locale}/shop/${slug}/register`} className="text-primary-600 hover:underline">
                {t("signUp")}
              </Link>
            </p>
            <Link href={`/${locale}/shop/${slug}`} className="text-center text-sm text-gray-400 hover:text-gray-600">
              ← Back to store
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
