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

export default function StorefrontRegisterPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const slug = params.slug as string;
  const t = useTranslations("auth.register");
  const [error, setError] = useState<string | null>(null);

  const registerSchema = z.object({
    first_name: z.string().min(1, t("firstNameRequired")),
    last_name: z.string().min(1, t("lastNameRequired")),
    email: z.string().email(t("emailInvalid")),
    password: z.string().min(8, t("passwordMin")),
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
      const result = await customerAuthApi.register(slug, {
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
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

      toast.success(t("welcome"));
      router.push(`/${locale}/shop/${slug}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string; email?: string[] } } };
      setError(
        axiosErr.response?.data?.detail ||
          axiosErr.response?.data?.email?.[0] ||
          t("registerFailed"),
      );
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
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t("firstName")}
                placeholder={t("firstNamePlaceholder")}
                error={errors.first_name?.message}
                {...register("first_name")}
              />
              <Input
                label={t("lastName")}
                placeholder={t("lastNamePlaceholder")}
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
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              {t("createAccount")}
            </Button>
            <p className="text-center text-sm text-gray-500">
              {t("hasAccount")}{" "}
              <Link href={`/${locale}/shop/${slug}/login`} className="text-primary-600 hover:underline">
                {t("signIn")}
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
