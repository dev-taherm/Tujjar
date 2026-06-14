"use client";

import { PageList } from "@/features/pages/page-list";

export default function PagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pages</h1>
        <p className="text-sm text-gray-500">Manage your store pages with the section builder.</p>
      </div>
      <PageList />
    </div>
  );
}
