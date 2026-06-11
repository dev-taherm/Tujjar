"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@/shared/ui";
import { useUpdateStore, useUpdateStoreSettings } from "@/api/queries";
import type { Store } from "@/shared/types";

const settingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

interface StoreSettingsFormProps {
  store: Store;
}

export function StoreSettingsForm({ store }: StoreSettingsFormProps) {
  const updateStore = useUpdateStore();
  const updateSettings = useUpdateStoreSettings();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: store.name,
      description: store.description,
      seo_title: store.seo_title,
      seo_description: store.seo_description,
    },
  });

  const onSubmit = async (data: SettingsForm) => {
    await updateStore.mutateAsync({ id: store.id, ...data });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Store Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Store Name"
            error={errors.name?.message}
            {...register("name")}
          />
          <Input
            label="Description"
            placeholder="A brief description of your store"
            {...register("description")}
          />
          <Input
            label="SEO Title"
            placeholder="Page title for search engines"
            {...register("seo_title")}
          />
          <Input
            label="SEO Description"
            placeholder="Page description for search engines"
            {...register("seo_description")}
          />
          <div className="flex justify-end">
            <Button type="submit" isLoading={isSubmitting} disabled={!isDirty}>
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
