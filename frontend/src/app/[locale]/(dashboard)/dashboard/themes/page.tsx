"use client";

import { ThemeList } from "@/features/themes/theme-list";

export default function ThemesPage() {
  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Themes</h1>
      <ThemeList />
    </div>
  );
}
