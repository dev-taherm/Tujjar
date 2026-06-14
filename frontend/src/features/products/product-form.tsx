"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Textarea, Select, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { LocaleToggle } from "@/shared/ui/locale-toggle";
import { useCreateProduct, useUpdateProduct, useCategories, useStores } from "@/api/queries";
import type { Product } from "@/shared/types";
import { Save, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface ProductFormProps {
  product?: Product;
  mode: "create" | "edit";
}

export function ProductForm({ product, mode }: ProductFormProps) {
  const t = useTranslations("dashboard.products");
  const tc = useTranslations("common");
  const router = useRouter();
  const { data: stores } = useStores();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [editLocale, setEditLocale] = useState("en");
  const [storeId, setStoreId] = useState(product?.store || "");
  const [title, setTitle] = useState(product?.title || "");
  const [slug, setSlug] = useState(product?.slug || "");
  const [description, setDescription] = useState(product?.description || "");
  const [productType, setProductType] = useState(product?.product_type || "physical");
  const [status, setStatus] = useState(product?.status || "draft");
  const [price, setPrice] = useState(String(product?.price || ""));
  const [compareAtPrice, setCompareAtPrice] = useState(String(product?.compare_at_price || ""));
  const [costPerItem, setCostPerItem] = useState(String(product?.cost_per_item || ""));
  const [sku, setSku] = useState(product?.sku || "");
  const [barcode, setBarcode] = useState(product?.barcode || "");
  const [trackInventory, setTrackInventory] = useState(product?.track_inventory ?? true);
  const [inventoryQuantity, setInventoryQuantity] = useState(String(product?.inventory_quantity || ""));
  const [allowBackorder, setAllowBackorder] = useState(product?.allow_backorder ?? false);
  const [lowStockThreshold, setLowStockThreshold] = useState(String(product?.low_stock_threshold || "5"));
  const [weight, setWeight] = useState(String(product?.weight || ""));
  const [requiresShipping, setRequiresShipping] = useState(product?.requires_shipping ?? true);
  const [seoTitle, setSeoTitle] = useState(product?.seo_title || "");
  const [seoDescription, setSeoDescription] = useState(product?.seo_description || "");
  const [isTaxable, setIsTaxable] = useState(product?.is_taxable ?? true);
  const [tags, setTags] = useState<string[]>(product?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [formError, setFormError] = useState("");

  const handleLocaleChange = useCallback(
    (newLocale: string) => {
      setEditLocale(newLocale);
      if (mode === "edit" && product) {
        if (newLocale === "en") {
          setTitle(product.title);
          setDescription(product.description);
          setSeoTitle(product.seo_title);
          setSeoDescription(product.seo_description);
          setTags(product.tags || []);
        } else {
          const localeData = product.translations?.[newLocale];
          setTitle(localeData?.title || "");
          setDescription(localeData?.description || "");
          setSeoTitle(localeData?.seo_title || "");
          setSeoDescription(localeData?.seo_description || "");
          setTags(localeData?.tags || []);
        }
      }
    },
    [product, mode]
  );

  // Auto-select first store on load
  useEffect(() => {
    if (stores?.length && !storeId && !product) {
      setStoreId(stores[0].id);
    }
  }, [stores, storeId, product]);

  useEffect(() => {
    if (!product && title && !slug) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""));
    }
  }, [title, product, slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!title || !price) {
      setFormError(t("titleAndPriceRequired"));
      return;
    }
    if (!storeId) {
      setFormError(t("pleaseSelectStore"));
      return;
    }

    const basePayload = {
      store: storeId,
      title,
      slug,
      description,
      product_type: productType,
      status,
      price: parseFloat(price),
      compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : null,
      cost_per_item: costPerItem ? parseFloat(costPerItem) : null,
      sku,
      barcode,
      track_inventory: trackInventory,
      inventory_quantity: parseInt(inventoryQuantity) || 0,
      allow_backorder: allowBackorder,
      low_stock_threshold: parseInt(lowStockThreshold) || 5,
      weight: weight ? parseFloat(weight) : null,
      requires_shipping: requiresShipping,
      seo_title: seoTitle,
      seo_description: seoDescription,
      is_taxable: isTaxable,
      tags,
    };

    const payload =
      editLocale !== "en" && product
        ? {
            ...basePayload,
            translations: {
              ...product.translations,
              [editLocale]: { title, description, seo_title: seoTitle, seo_description: seoDescription, tags },
            },
          }
        : basePayload;

    try {
      if (mode === "create") {
        const created = await createProduct.mutateAsync(payload);
        router.push(`/dashboard/products/${created.id}`);
      } else if (product) {
        await updateProduct.mutateAsync({ id: product.id, ...payload });
        router.push(`/dashboard/products/${product.id}`);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string }; detail?: string } }; message?: string };
      const msg = axiosErr?.response?.data?.error?.message
        || axiosErr?.response?.data?.detail
        || axiosErr?.message
        || "An error occurred. Please try again.";
      setFormError(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  const addTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const productTypes = [
    { value: "physical", label: t("physicalProduct") },
    { value: "digital", label: t("digitalProduct") },
    { value: "service", label: t("service") },
  ];

  const statusOptions = [
    { value: "draft", label: tc("draft") },
    { value: "active", label: tc("active") },
    { value: "archived", label: t("archived") },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.back()} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {mode === "create" ? t("addProduct") : `${tc("edit")} ${product?.title}`}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>{tc("cancel")}</Button>
          <Button type="submit" isLoading={createProduct.isPending || updateProduct.isPending}>
            <Save className="me-2 h-4 w-4" /> {mode === "create" ? tc("create") : tc("save")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("basicInfo")}</CardTitle>
                {mode === "edit" && <LocaleToggle value={editLocale} onChange={handleLocaleChange} />}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editLocale !== "en" && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                  Editing {editLocale === "ar" ? "Arabic" : editLocale} translations. English values are used as fallback.
                </div>
              )}
              <Input label={t("productTitle")} value={title} onChange={(e) => setTitle(e.target.value)} required />
              <Input label={t("slug")} value={slug} onChange={(e) => setSlug(e.target.value)} />
              <Textarea label={t("description")} value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("pricing")}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input label={t("price")} type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
              <Input label={t("compareAtPrice")} type="number" step="0.01" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} placeholder={t("optional")} />
              <Input label={t("costPerItem")} type="number" step="0.01" value={costPerItem} onChange={(e) => setCostPerItem(e.target.value)} placeholder={t("optional")} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("inventory")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label={t("sku")} value={sku} onChange={(e) => setSku(e.target.value)} placeholder={t("stockKeepingUnit")} />
                <Input label={t("barcode")} value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="UPC, EAN, etc." />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">{t("trackInventory")}</label>
                <button type="button" onClick={() => setTrackInventory(!trackInventory)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${trackInventory ? "bg-blue-600" : "bg-gray-200"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${trackInventory ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
              {trackInventory && (
                <>
                  <Input label={t("inventoryQuantity")} type="number" value={inventoryQuantity} onChange={(e) => setInventoryQuantity(e.target.value)} />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input label={t("lowStockThreshold")} type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} />
                    <div className="flex items-center justify-between pt-6">
                      <label className="text-sm font-medium text-gray-700">{t("allowBackorder")}</label>
                      <button type="button" onClick={() => setAllowBackorder(!allowBackorder)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${allowBackorder ? "bg-blue-600" : "bg-gray-200"}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${allowBackorder ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("seo")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input label={t("seoTitle")} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder={t("overridePageTitle")} />
              <Textarea label={t("seoDescription")} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={2} placeholder={t("metaDescription")} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>{t("status")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {!stores?.length ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                  {t("needStoreFirst")}
                  <Button type="button" variant="link" className="ms-1 p-0" onClick={() => router.push("/dashboard/stores")}>
                    {t("createStore")}
                  </Button>
                </div>
              ) : (
                <Select label={t("store")} options={stores.map((s) => ({ value: s.id, label: s.name }))} value={storeId} onChange={(e) => setStoreId(e.target.value)} placeholder={t("selectStore")} required />
              )}
              <Select label={t("productType")} options={productTypes} value={productType} onChange={(e) => setProductType(e.target.value as "physical" | "digital" | "service")} />
              <Select label={t("status")} options={statusOptions} value={status} onChange={(e) => setStatus(e.target.value as "draft" | "active" | "archived")} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("shipping")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input label={t("weight")} type="number" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder={t("optional")} />
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">{t("requiresShipping")}</label>
                <button type="button" onClick={() => setRequiresShipping(!requiresShipping)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${requiresShipping ? "bg-blue-600" : "bg-gray-200"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${requiresShipping ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">{t("taxable")}</label>
                <button type="button" onClick={() => setIsTaxable(!isTaxable)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isTaxable ? "bg-blue-600" : "bg-gray-200"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isTaxable ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("tags")}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder={t("addTag")}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <Button type="button" size="sm" onClick={addTag}>{tc("add")}</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
