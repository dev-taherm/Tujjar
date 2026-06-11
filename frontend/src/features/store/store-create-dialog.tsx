"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/shared/ui";
import { useCreateStore } from "@/api/queries";

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
    } catch (err: any) {
      // Error handled by React Query
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Create Store</CardTitle>
            <CardDescription>Set up a new online store</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Store Name"
              placeholder="My Store"
              error={errors.name?.message}
              {...register("name")}
            />
            <Input
              label="Slug (URL)"
              placeholder="my-store"
              error={errors.slug?.message}
              {...register("slug")}
            />
            <Input
              label="Description (optional)"
              placeholder="A brief description of your store"
              {...register("description")}
            />
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Store
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
