"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { slugify } from "@/lib/utils";
import { useCategories, useCreateCategory, useDeleteCategory } from "@/api/queries";
import type { Category } from "@/shared/types";
import { Plus, ChevronRight, ChevronDown, FolderTree, Trash2, Edit, GripVertical, Image } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

interface CategoryNodeProps {
  category: Category;
  depth?: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function CategoryNode({ category, depth = 0, onEdit, onDelete }: CategoryNodeProps) {
  const t = useTranslations("dashboard.products");
  const [expanded, setExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div>
      <div className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-50 active:bg-gray-100" style={{ paddingLeft: `${depth * 24 + 12}px` }}>
        {hasChildren ? (
          <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <div className="w-4" />
        )}
        <GripVertical className="h-4 w-4 text-gray-300" />
        <FolderTree className="h-4 w-4 text-amber-500" />
        {category.image ? (
          <img src={category.image} alt={category.name} className="h-6 w-6 rounded object-cover" />
        ) : (
          <div className="h-6 w-6 rounded bg-gray-100 flex items-center justify-center">
            <Image className="h-3 w-3 text-gray-400" />
          </div>
        )}
        <span className="flex-1 text-sm font-medium text-gray-700">{category.name}</span>
        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">#{category.sort_order}</span>
        <span className="text-xs text-gray-400">{category.product_count} {t("totalProducts").toLowerCase()}</span>
        <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 opacity-100">
          <button onClick={() => onEdit(category.id)} className="rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-gray-200"><Edit className="h-3.5 w-3.5 text-gray-500" /></button>
          <button onClick={() => onDelete(category.id)} className="rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-red-50"><Trash2 className="h-3.5 w-3.5 text-red-500" /></button>
        </div>
      </div>
      {expanded && hasChildren && (
        <div>
          {category.children.map((child: Category) => (
            <CategoryNode key={child.id} category={child} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryTree() {
  const t = useTranslations("dashboard.products");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");

  const handleCreate = async () => {
    if (!newName || !newSlug) return;
    await createCategory.mutateAsync({ name: newName, slug: newSlug } as Partial<Category>);
    setShowCreate(false);
    setNewName("");
    setNewSlug("");
  };

  const handleDelete = async (id: string) => {
    if (confirm(t("deleteCategoryConfirm"))) {
      await deleteCategory.mutateAsync(id);
    }
  };

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-xl bg-gray-200" />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("categories")}</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => router.push(`/${locale}/dashboard/products/categories/new`)}>
            <Plus className="me-1 h-4 w-4" /> {t("newCategory")}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowCreate(true)}>
            <Plus className="me-1 h-4 w-4" /> {tc("add")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!categories?.length ? (
          <div className="py-8 text-center text-sm text-gray-500">{t("noCategories")}</div>
        ) : (
          <div className="space-y-0.5">
            {categories.map((cat) => (
              <div key={cat.id} className="group">
                <CategoryNode
                  category={cat}
                  onEdit={(id) => router.push(`/${locale}/dashboard/products/categories/${id}`)}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
        )}

        {showCreate && (
          <div className="mt-4 space-y-3 rounded-lg border border-gray-200 p-4">
            <Input label={tc("add")} value={newName} onChange={(e) => { setNewName(e.target.value); setNewSlug(slugify(e.target.value)); }} />
            <Input label={t("slug")} value={newSlug} onChange={(e) => setNewSlug(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>{tc("cancel")}</Button>
              <Button size="sm" onClick={handleCreate} isLoading={createCategory.isPending}>{tc("create")}</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
