"use client";

import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  productsApi,
  mediaApi,
  useCategories,
  useProductOptions,
  useCreateProductOption,
  useAddOptionValue,
  useDeleteOptionValue,
  useDeleteProductOption,
} from "@/api/queries";
import type { Product, Category, ProductImage, ProductOption } from "@/shared/types";
import { Save, ArrowLeft, Plus, Trash2, ChevronDown, ChevronRight, Star, GripVertical, X } from "lucide-react";

interface ProductFormProps {
  onSuccess?: () => void;
  initialData?: Product;
}

export function ProductForm({ onSuccess, initialData }: ProductFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!initialData?.id;

  const { data: allCategories } = useCategories();
  const { data: productOptions } = useProductOptions(initialData?.id || "");
  const createOption = useCreateProductOption();
  const addOptionValue = useAddOptionValue();
  const deleteOptionValue = useDeleteOptionValue();
  const deleteOption = useDeleteProductOption();

  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [shortDescription, setShortDescription] = useState(initialData?.short_description || "");
  const [price, setPrice] = useState(initialData?.price || "");
  const [compareAtPrice, setCompareAtPrice] = useState(initialData?.compare_at_price || "");
  const [costPerItem, setCostPerItem] = useState(initialData?.cost_per_item || "");
  const [sku, setSku] = useState(initialData?.sku || "");
  const [barcode, setBarcode] = useState(initialData?.barcode || "");
  const [trackInventory, setTrackInventory] = useState(initialData?.track_inventory ?? true);
  const [quantity, setQuantity] = useState(initialData?.quantity || "");
  const [weight, setWeight] = useState(initialData?.weight || "");
  const [weightUnit, setWeightUnit] = useState(initialData?.weight_unit || "kg");
  const [requiresShipping, setRequiresShipping] = useState(initialData?.requires_shipping ?? true);
  const [isTaxable, setIsTaxable] = useState(initialData?.is_taxable ?? false);
  const [taxCode, setTaxCode] = useState(initialData?.tax_code || "");
  const [status, setStatus] = useState<"draft" | "active" | "archived">(initialData?.status || "draft");
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [seoTitle, setSeoTitle] = useState(initialData?.seo_title || "");
  const [seoDescription, setSeoDescription] = useState(initialData?.seo_description || "");
  const [handle, setHandle] = useState(initialData?.handle || "");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(initialData?.category_ids || []);
  const [sectionsOpen, setSectionsOpen] = useState({
    description: true,
    media: true,
    variants: false,
    seo: false,
    tax: false,
  });
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [images, setImages] = useState<ProductImage[]>(initialData?.images || []);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [dragOverImageIndex, setDragOverImageIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newOptionName, setNewOptionName] = useState("");
  const [optionValueInputs, setOptionValueInputs] = useState<Record<string, string>>({});

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSaving(true);

    try {
      const payload = {
        title,
        slug,
        description,
        short_description: shortDescription,
        price: parseFloat(price as string) || undefined,
        compare_at_price: parseFloat(compareAtPrice as string) || undefined,
        cost_per_item: parseFloat(costPerItem as string) || undefined,
        sku: sku || undefined,
        barcode: barcode || undefined,
        track_inventory: trackInventory,
        quantity: parseInt(quantity as string) || 0,
        weight: parseFloat(weight as string) || undefined,
        weight_unit: weightUnit,
        requires_shipping: requiresShipping,
        is_taxable: isTaxable,
        tax_code: taxCode || undefined,
        status,
        tags: tags.length > 0 ? tags : undefined,
        seo_title: seoTitle || undefined,
        seo_description: seoDescription || undefined,
        handle: handle || undefined,
        category_ids: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
      };

      if (isEditing && initialData?.id) {
        await productsApi.update(initialData.id, payload);
        await queryClient.invalidateQueries({ queryKey: ["products", initialData.id] });
        await queryClient.invalidateQueries({ queryKey: ["storefront", "product"] });
      } else {
        await productsApi.create(payload);
      }

      onSuccess?.();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string }; detail?: string } }; message?: string };
      const msg =
        axiosErr?.response?.data?.error?.message ||
        axiosErr?.response?.data?.detail ||
        axiosErr?.message ||
        "An error occurred. Please try again.";
      setFormError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setIsSaving(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || !initialData?.id) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const result = await mediaApi.upload(file, undefined, file.name);
        await productsApi.addImage(initialData.id, {
          url: result.file_url,
          media_asset: result.id,
          alt_text: file.name,
        });
      } catch {
        /* skip */
      }
    }
    queryClient.invalidateQueries({ queryKey: ["products", initialData.id] });
  };

  const handleImageDragStart = (index: number) => {
    setDraggedImageIndex(index);
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverImageIndex(index);
  };

  const handleImageDrop = async (targetIndex: number) => {
    if (draggedImageIndex === null || draggedImageIndex === targetIndex || !initialData?.id) {
      setDraggedImageIndex(null);
      setDragOverImageIndex(null);
      return;
    }

    const newImages = [...images];
    const [removed] = newImages.splice(draggedImageIndex, 1);
    newImages.splice(targetIndex, 0, removed);
    setImages(newImages);

    const imagePositions = newImages.map((img, idx) => ({ id: img.id, position: idx }));
    await productsApi.reorderImages(initialData.id, imagePositions);

    setDraggedImageIndex(null);
    setDragOverImageIndex(null);
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!initialData?.id) return;
    await productsApi.deleteImage(initialData.id, imageId);
    setImages((prev) => prev.filter((img) => img.id !== imageId));
    queryClient.invalidateQueries({ queryKey: ["products", initialData.id] });
  };

  const handleSetPrimaryImage = async (imageId: string) => {
    if (!initialData?.id) return;
    await productsApi.setPrimaryImage(initialData.id, imageId);
    setImages((prev) =>
      prev.map((img) => ({ ...img, is_primary: img.id === imageId }))
    );
    queryClient.invalidateQueries({ queryKey: ["products", initialData.id] });
  };

  const handleAddOption = async () => {
    if (!newOptionName.trim() || !initialData?.id) return;
    const position = productOptions?.length || 0;
    await createOption.mutateAsync({
      productId: initialData.id,
      name: newOptionName.trim(),
      position,
    });
    setNewOptionName("");
  };

  const handleDeleteOption = async (optionId: string) => {
    if (!initialData?.id) return;
    await deleteOption.mutateAsync({ productId: initialData.id, optionId });
  };

  const handleAddOptionValue = async (optionId: string) => {
    const value = optionValueInputs[optionId];
    if (!value?.trim() || !initialData?.id) return;

    const values = value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

    for (const v of values) {
      await addOptionValue.mutateAsync({
        productId: initialData.id,
        optionId,
        value: v,
      });
    }
    setOptionValueInputs((prev) => ({ ...prev, [optionId]: "" }));
  };

  const handleDeleteOptionValue = async (optionId: string, valueId: string) => {
    if (!initialData?.id) return;
    await deleteOptionValue.mutateAsync({
      productId: initialData.id,
      optionId,
      valueId,
    });
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const categoriesByParent = (parentId: string | null): Category[] => {
    if (!allCategories) return [];
    return allCategories.filter((c) => (parentId === null ? !c.parent : c.parent === parentId));
  };

  const renderCategoryTree = (parentId: string | null, depth: number = 0) => {
    const cats = categoriesByParent(parentId);
    if (cats.length === 0) return null;
    return cats.map((cat) => (
      <div key={cat.id} style={{ paddingLeft: depth * 20 }}>
        <label className="flex items-center gap-2 py-1 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedCategoryIds.includes(cat.id)}
            onChange={() => toggleCategory(cat.id)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">{cat.name}</span>
          {cat.product_count > 0 && (
            <span className="text-xs text-gray-400">({cat.product_count})</span>
          )}
        </label>
        {depth < 1 && renderCategoryTree(cat.id, depth + 1)}
      </div>
    ));
  };

  const renderSectionHeader = (title: string, section: keyof typeof sectionsOpen) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="flex w-full items-center justify-between px-6 py-4 text-left"
    >
      <span className="text-sm font-semibold text-gray-900">{title}</span>
      {sectionsOpen[section] ? (
        <ChevronDown className="h-4 w-4 text-gray-400" />
      ) : (
        <ChevronRight className="h-4 w-4 text-gray-400" />
      )}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? `Edit ${initialData?.title}` : "Add product"}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : isEditing ? "Save" : "Create"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Basic info</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short description</label>
                <textarea
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Pricing</h2>
            </div>
            <div className="p-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Compare at price</label>
                <input
                  type="number"
                  step="0.01"
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost per item</label>
                <input
                  type="number"
                  step="0.01"
                  value={costPerItem}
                  onChange={(e) => setCostPerItem(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Inventory</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Stock keeping unit"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="UPC, EAN, etc."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={trackInventory}
                  onChange={() => setTrackInventory(!trackInventory)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Track inventory</span>
              </label>
              {trackInventory && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Shipping</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                  <input
                    type="number"
                    step="0.01"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight unit</label>
                  <select
                    value={weightUnit}
                    onChange={(e) => setWeightUnit(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="kg">kg</option>
                    <option value="lb">lb</option>
                    <option value="oz">oz</option>
                    <option value="g">g</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiresShipping}
                  onChange={() => setRequiresShipping(!requiresShipping)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Requires shipping</span>
              </label>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white">
            {renderSectionHeader("Media", "media")}
            {sectionsOpen.media && (
              <div className="px-6 pb-6 space-y-4">
                {images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {images.map((image, index) => (
                      <div
                        key={image.id}
                        draggable
                        onDragStart={() => handleImageDragStart(index)}
                        onDragOver={(e) => handleImageDragOver(e, index)}
                        onDrop={() => handleImageDrop(index)}
                        onDragEnd={() => {
                          setDraggedImageIndex(null);
                          setDragOverImageIndex(null);
                        }}
                        className={`group relative rounded-lg border-2 bg-gray-50 aspect-square overflow-hidden cursor-grab ${
                          dragOverImageIndex === index
                            ? "border-blue-500"
                            : "border-gray-200"
                        } ${draggedImageIndex === index ? "opacity-50" : ""}`}
                      >
                        <img
                          src={image.url || image.file_url}
                          alt={image.alt_text}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors">
                          <div className="absolute top-1 left-1">
                            <GripVertical className="h-4 w-4 text-white/70" />
                          </div>
                          <div className="absolute top-1 right-1 flex gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetPrimaryImage(image.id);
                              }}
                              className={`rounded-full p-1 ${
                                image.is_primary
                                  ? "bg-yellow-400 text-yellow-900"
                                  : "bg-white/80 text-gray-600 hover:bg-white"
                              }`}
                              title="Set as primary"
                            >
                              <Star className="h-3 w-3" fill={image.is_primary ? "currentColor" : "none"} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteImage(image.id);
                              }}
                              className="rounded-full bg-white/80 p-1 text-gray-600 hover:bg-red-500 hover:text-white"
                              title="Delete image"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          {image.is_primary && (
                            <div className="absolute bottom-1 left-1">
                              <span className="inline-flex items-center rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-medium text-yellow-900">
                                Primary
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                    <p className="text-sm text-gray-500">No images yet</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4" />
                  Add image
                </button>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white">
            {renderSectionHeader("Variants", "variants")}
            {sectionsOpen.variants && (
              <div className="px-6 pb-6 space-y-4">
                {productOptions && productOptions.length > 0 ? (
                  productOptions.map((option: ProductOption) => (
                    <div key={option.id} className="rounded-lg border border-gray-200 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{option.name}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteOption(option.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {option.values.map((val) => (
                          <span
                            key={val.id}
                            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm"
                          >
                            {val.value}
                            <button
                              type="button"
                              onClick={() => handleDeleteOptionValue(option.id, val.id)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={optionValueInputs[option.id] || ""}
                          onChange={(e) =>
                            setOptionValueInputs((prev) => ({
                              ...prev,
                              [option.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddOptionValue(option.id);
                            }
                          }}
                          placeholder="Add values (comma separated)"
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddOptionValue(option.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <Plus className="h-3 w-3" />
                          Add
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No options yet. Add one below.</p>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newOptionName}
                    onChange={(e) => setNewOptionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                    placeholder="Option name (e.g. Color, Size)"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddOption}
                    disabled={!newOptionName.trim()}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Plus className="h-3 w-3" />
                    Add option
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white">
            {renderSectionHeader("SEO", "seo")}
            {sectionsOpen.seo && (
              <div className="px-6 pb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SEO title</label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value.slice(0, 60))}
                    maxLength={60}
                    placeholder="Override page title"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">{seoTitle.length}/60</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SEO description</label>
                  <textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value.slice(0, 160))}
                    maxLength={160}
                    rows={2}
                    placeholder="Meta description"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">{seoDescription.length}/160</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Handle (URL slug)</label>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="Custom URL handle"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white">
            {renderSectionHeader("Tax", "tax")}
            {sectionsOpen.tax && (
              <div className="px-6 pb-6 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isTaxable}
                    onChange={() => setIsTaxable(!isTaxable)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Taxable</span>
                </label>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax code</label>
                  <input
                    type="text"
                    value={taxCode}
                    onChange={(e) => setTaxCode(e.target.value)}
                    placeholder="Tax code"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Status</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "draft" | "active" | "archived")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Categories</h2>
            </div>
            <div className="p-6">
              {allCategories && allCategories.length > 0 ? (
                <div className="space-y-1">{renderCategoryTree(null)}</div>
              ) : (
                <p className="text-sm text-gray-500">No categories available</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Tags</h2>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add tag"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
