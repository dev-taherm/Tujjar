"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/shared/ui";
import { useCreateStore } from "@/api/queries";
import { useTranslations } from "next-intl";

const storeSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
});

type StoreForm = z.infer<typeof storeSchema>;

interface StoreCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function StoreCreateDialog({ open, onClose, onSuccess }: StoreCreateDialogProps) {
  const t = useTranslations("storeSettings");
  const tc = useTranslations("common");
  const createStore = useCreateStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<StoreForm>({
    resolver: zodResolver(storeSchema),
  });

  const onSubmit = async (data: StoreForm) => {
    try {
      await createStore.mutateAsync(data);
      reset();
      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      // Error handled by React Query
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>{t("createStore")}</CardTitle>
            <CardDescription>{t("setNewStore")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label={t("storeName")}
              placeholder="My Store"
              error={errors.name?.message}
              {...register("name")}
            />
            <Input
              label={t("slug")}
              placeholder={t("slugPlaceholder")}
              error={errors.slug?.message}
              {...register("slug")}
            />
            <Input
              label={t("description")}
              placeholder={t("descriptionPlaceholder")}
              {...register("description")}
            />
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              {tc("cancel")}
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {t("createStore")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
