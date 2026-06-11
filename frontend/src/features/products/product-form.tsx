"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Textarea, Select, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { useCreateProduct, useUpdateProduct, useCategories, useStores } from "@/api/queries";
import type { Product } from "@/shared/types";
import { Save, ArrowLeft, Plus, Trash2 } from "lucide-react";

interface ProductFormProps {
  product?: Product;
  mode: "create" | "edit";
}

export function ProductForm({ product, mode }: ProductFormProps) {
  const router = useRouter();
  const { data: stores } = useStores();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

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

  useEffect(() => {
    if (!product && title && !slug) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""));
    }
  }, [title, product, slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !storeId) return;

    const payload = {
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

    if (mode === "create") {
      const created = await createProduct.mutateAsync(payload);
      router.push(`/dashboard/products/${created.id}`);
    } else if (product) {
      await updateProduct.mutateAsync({ id: product.id, ...payload });
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
    { value: "physical", label: "Physical Product" },
    { value: "digital", label: "Digital Product" },
    { value: "service", label: "Service" },
  ];

  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "active", label: "Active" },
    { value: "archived", label: "Archived" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.back()} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {mode === "create" ? "Add Product" : `Edit ${product?.title}`}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" isLoading={createProduct.isPending || updateProduct.isPending}>
            <Save className="mr-2 h-4 w-4" /> {mode === "create" ? "Create" : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Basic Info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input label="Product Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
              <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input label="Price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
              <Input label="Compare at Price" type="number" step="0.01" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} placeholder="Optional" />
              <Input label="Cost per Item" type="number" step="0.01" value={costPerItem} onChange={(e) => setCostPerItem(e.target.value)} placeholder="Optional" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Inventory</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="SKU" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Stock keeping unit" />
                <Input label="Barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="UPC, EAN, etc." />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Track Inventory</label>
                <button type="button" onClick={() => setTrackInventory(!trackInventory)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${trackInventory ? "bg-blue-600" : "bg-gray-200"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${trackInventory ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
              {trackInventory && (
                <>
                  <Input label="Inventory Quantity" type="number" value={inventoryQuantity} onChange={(e) => setInventoryQuantity(e.target.value)} />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input label="Low Stock Threshold" type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} />
                    <div className="flex items-center justify-between pt-6">
                      <label className="text-sm font-medium text-gray-700">Allow Backorder</label>
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
            <CardHeader><CardTitle>SEO</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input label="SEO Title" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Override page title" />
              <Textarea label="SEO Description" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={2} placeholder="Meta description" />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Status</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {!stores?.length ? (
                <Input label="Store ID" value={storeId} onChange={(e) => setStoreId(e.target.value)} required />
              ) : (
                <Select label="Store" options={stores.map((s) => ({ value: s.id, label: s.name }))} value={storeId} onChange={(e) => setStoreId(e.target.value)} required />
              )}
              <Select label="Product Type" options={productTypes} value={productType} onChange={(e) => setProductType(e.target.value as "physical" | "digital" | "service")} />
              <Select label="Status" options={statusOptions} value={status} onChange={(e) => setStatus(e.target.value as "draft" | "active" | "archived")} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Shipping</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input label="Weight (g)" type="number" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Optional" />
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Requires Shipping</label>
                <button type="button" onClick={() => setRequiresShipping(!requiresShipping)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${requiresShipping ? "bg-blue-600" : "bg-gray-200"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${requiresShipping ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Taxable</label>
                <button type="button" onClick={() => setIsTaxable(!isTaxable)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isTaxable ? "bg-blue-600" : "bg-gray-200"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isTaxable ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder="Add tag..."
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <Button type="button" size="sm" onClick={addTag}>Add</Button>
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
