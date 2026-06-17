"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/shared/ui";
import { useCreateStoreWizard, useCheckSlug } from "@/api/queries";
import { useTemplates } from "@/api/templates";
import { useTranslations } from "next-intl";
import { Check, ArrowRight, ArrowLeft, Store, PenTool } from "lucide-react";

const STEPS = ["details", "template", "features", "domain"] as const;
type Step = (typeof STEPS)[number];

const CATEGORY_ICONS: Record<string, string> = {
  fashion: "👗",
  electronics: "💻",
  restaurant: "🍕",
  pharmacy: "💊",
  furniture: "🪑",
  general: "🏪",
};

const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

const storeDetailsSchema = z.object({
  name: z.string().min(1, "Store name is required").max(255),
  slug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
});

type StoreDetailsForm = z.infer<typeof storeDetailsSchema>;

interface StoreCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function StoreCreateDialog({ open, onClose, onSuccess }: StoreCreateDialogProps) {
  const t = useTranslations("storeSettings");
  const tc = useTranslations("common");
  const createStore = useCreateStoreWizard();
  const checkSlug = useCheckSlug();
  const { data: templateData } = useTemplates();
  const templates = templateData?.results || [];
  const [step, setStep] = useState<Step>("details");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [customDomain, setCustomDomain] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  const [homePage, setHomePage] = useState<string>("/");
  const [enableShop, setEnableShop] = useState(true);
  const [enableBlog, setEnableBlog] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StoreDetailsForm>({
    resolver: zodResolver(storeDetailsSchema),
    defaultValues: { name: "", slug: "", description: "" },
  });

  const watchName = watch("name");
  const watchSlug = watch("slug");

  const autoGenerateSlug = useCallback((name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    setValue("slug", slug, { shouldValidate: true });
  }, [setValue]);

  const [lastAutoGenName, setLastAutoGenName] = useState("");
  if (watchName && watchName !== lastAutoGenName && !watchSlug) {
    setLastAutoGenName(watchName);
    autoGenerateSlug(watchName);
  }

  useEffect(() => {
    if (watchSlug && watchSlug.length >= 3) {
      const timer = setTimeout(() => {
        checkSlug.mutate(watchSlug, {
          onSuccess: (data) => setSlugAvailable(data.available),
          onError: () => setSlugAvailable(null),
        });
      }, 500);
      return () => clearTimeout(timer);
    }
    setSlugAvailable(null);
  }, [watchSlug, checkSlug]);

  const [lastHomePage, setLastHomePage] = useState(homePage);
  if (homePage !== lastHomePage) {
    setLastHomePage(homePage);
    if (homePage === "/shop") {
      setEnableShop(true);
    }
    if (homePage === "/shop/blog") {
      setEnableBlog(true);
    }
  }

  const stepIndex = STEPS.indexOf(step);

  const handleNext = () => {
    if (stepIndex < STEPS.length - 1) {
      setStep(STEPS[stepIndex + 1]);
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStep(STEPS[stepIndex - 1]);
    }
  };

  const [domainError, setDomainError] = useState<string | null>(null);

  const handleFinalSubmit = async (data: StoreDetailsForm) => {
    if (customDomain && !DOMAIN_REGEX.test(customDomain)) {
      setDomainError("Please enter a valid domain (e.g. www.mystore.com)");
      return;
    }
    setDomainError(null);
    try {
      await createStore.mutateAsync({
        name: data.name,
        slug: data.slug,
        description: data.description,
        template_id: selectedTemplateId,
        custom_domain: customDomain || undefined,
        home_page: homePage,
        enable_shop: enableShop,
        enable_blog: enableBlog,
      });
      toast.success(t("storeCreated"));
      onClose();
      onSuccess?.();
    } catch (error: unknown) {
      const message =
        (error && typeof error === "object" && "response" in error)
          ? (error as { response?: { data?: { error?: string; detail?: string; slug?: string } } })?.response?.data?.error
            || (error as { response?: { data?: { error?: string; detail?: string; slug?: string } } })?.response?.data?.detail
            || (error as { response?: { data?: { error?: string; detail?: string; slug?: string } } })?.response?.data?.slug
          : undefined;
      toast.error(message || "Failed to create store. Please try again.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                  i < stepIndex ? "bg-green-500 text-white" :
                  i === stepIndex ? "bg-primary-600 text-white" :
                  "bg-gray-200 text-gray-500"
                }`}>
                  {i < stepIndex ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && <div className={`h-px w-8 ${i < stepIndex ? "bg-green-500" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
          <CardTitle>{t("createStore")}</CardTitle>
          <CardDescription>
            {step === "details" && t("wizardStepDetails")}
            {step === "template" && t("wizardStepTemplate")}
            {step === "features" && t("wizardStepFeatures")}
            {step === "domain" && t("wizardStepDomain")}
          </CardDescription>
        </CardHeader>

        <CardContent className="min-h-[200px]">
          {step === "details" && (
            <form id="store-details-form" onSubmit={handleSubmit(handleNext)} className="space-y-4">
              <Input
                label={t("storeName")}
                placeholder="My Store"
                error={errors.name?.message}
                {...register("name")}
              />
              <div>
                <Input
                  label={t("slug")}
                  placeholder="my-store"
                  error={errors.slug?.message}
                  {...register("slug")}
                />
                {slugAvailable === true && (
                  <p className="mt-1 text-xs text-green-600">Slug is available</p>
                )}
                {slugAvailable === false && (
                  <p className="mt-1 text-xs text-red-600">Slug is already taken</p>
                )}
              </div>
              <Input
                label={t("description")}
                placeholder={t("descriptionPlaceholder")}
                {...register("description")}
              />
            </form>
          )}

          {step === "template" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">{t("wizardTemplateHint")}</p>
              <TemplateGrid
                templates={templates || []}
                selectedId={selectedTemplateId}
                onSelect={setSelectedTemplateId}
              />
            </div>
          )}

          {step === "features" && (
            <div className="space-y-6">
              <p className="text-sm text-gray-600">{t("wizardFeaturesHint")}</p>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">{t("homePage")}</label>
                <select
                  value={homePage}
                  onChange={(e) => setHomePage(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="/">{t("homePageHomepage")}</option>
                  <option value="/shop">{t("homePageShop")}</option>
                  <option value="/shop/blog">{t("homePageBlog")}</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">{t("homePageHint")}</p>
              </div>

              <div className="space-y-3">
                <FeatureToggle
                  icon={<Store className="h-5 w-5" />}
                  label={t("enableShop")}
                  description={t("enableShopDescription")}
                  enabled={enableShop}
                  onChange={setEnableShop}
                  disabled={homePage === "/shop"}
                />
                <FeatureToggle
                  icon={<PenTool className="h-5 w-5" />}
                  label={t("enableBlog")}
                  description={t("enableBlogDescription")}
                  enabled={enableBlog}
                  onChange={setEnableBlog}
                  disabled={homePage === "/shop/blog"}
                />
              </div>

              {!enableShop && (
                <p className="text-xs text-amber-600">{t("ctaDisabledHint")}</p>
              )}
            </div>
          )}

          {step === "domain" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">{t("wizardDomainHint")}</p>
              <Input
                label={t("customDomain")}
                placeholder="www.mystore.com"
                value={customDomain}
                onChange={(e) => { setCustomDomain(e.target.value); setDomainError(null); }}
                error={domainError || undefined}
              />
              <p className="text-xs text-gray-500">{t("customDomainHelp")}</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={stepIndex === 0 ? onClose : handleBack}
          >
            {stepIndex === 0 ? tc("cancel") : (
              <><ArrowLeft className="me-1 h-4 w-4" /> {tc("back")}</>
            )}
          </Button>
          {stepIndex < STEPS.length - 1 ? (
            <Button type="button" onClick={handleNext}>
              {tc("next")} <ArrowRight className="ms-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit(handleFinalSubmit)}
              isLoading={createStore.isPending}
            >
              {t("createStore")}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

function FeatureToggle({
  icon,
  label,
  description,
  enabled,
  onChange,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl border p-4 transition-colors ${
        disabled
          ? "border-gray-100 bg-gray-50 opacity-60"
          : enabled
          ? "border-blue-200 bg-blue-50"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
          enabled ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
        }`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? "bg-blue-600" : "bg-gray-300"
        } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

function TemplateGrid({ templates, selectedId, onSelect }: { templates: Array<{ id: string; name: string; category: string; description: string }>; selectedId: string | null; onSelect: (id: string | null) => void }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {templates.map((tmpl) => (
        <button
          key={tmpl.id}
          type="button"
          onClick={() => onSelect(selectedId === tmpl.id ? null : tmpl.id)}
          className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-colors ${
            selectedId === tmpl.id
              ? "border-primary-500 bg-primary-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <span className="text-2xl">{CATEGORY_ICONS[tmpl.category] || "🏪"}</span>
          <span className="text-sm font-medium">{tmpl.name}</span>
          {tmpl.description && (
            <span className="text-xs text-gray-500 line-clamp-2">{tmpl.description}</span>
          )}
        </button>
      ))}
    </div>
  );
}
