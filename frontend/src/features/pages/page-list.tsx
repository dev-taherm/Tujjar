"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, Badge, Input, Select } from "@/shared/ui";
import { usePages, useCreatePage, useDeletePage, useStores } from "@/api/queries";
import { Plus, FileText, Trash2, Globe, Clock } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export function PageList() {
  const { data: pages, isLoading } = usePages();
  const { data: stores } = useStores();
  const createPage = useCreatePage();
  const deletePage = useDeletePage();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newStore, setNewStore] = useState("");

  const handleCreate = async () => {
    if (!newTitle || !newSlug || !newStore) return;
    await createPage.mutateAsync({ title: newTitle, slug: newSlug, store: newStore });
    setShowCreate(false);
    setNewTitle("");
    setNewSlug("");
  };

  if (isLoading) {
    return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-200" />)}</div>;
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Pages</h2>
          <p className="text-sm text-gray-500">{pages?.length || 0} page{(pages?.length || 0) !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" /> Create Page</Button>
      </div>

      {!pages?.length ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-16">
          <FileText className="mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">No pages yet</h3>
          <p className="mb-6 text-sm text-gray-500">Create your first page to start building.</p>
          <Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" /> Create Page</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <Link key={page.id} href={`/dashboard/pages/${page.id}`}>
              <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-primary-300">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{page.title}</h3>
                    <Badge variant={page.is_published ? "success" : "secondary"}>
                      {page.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <p className="mb-3 text-sm text-gray-500">/{page.slug}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {page.section_count} section{page.section_count !== 1 ? "s" : ""}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDateTime(page.updated_at)}</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h2 className="mb-4 text-lg font-semibold">Create Page</h2>
              <div className="space-y-4">
                <Input label="Page Title" value={newTitle} onChange={(e) => { setNewTitle(e.target.value); setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-")); }} />
                <Input label="Slug" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} />
                <Select label="Store" options={(stores || []).map((s) => ({ value: s.id, label: s.name }))} value={newStore} onChange={(e) => setNewStore(e.target.value)} placeholder="Select a store" />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button onClick={handleCreate} isLoading={createPage.isPending} disabled={!newTitle || !newSlug || !newStore}>Create</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
