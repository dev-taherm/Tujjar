"use client";

import { useState } from "react";
import { ThemeList } from "@/features/themes/theme-list";
import { ThemeImportDialog } from "@/features/themes/theme-import-dialog";
import { useTranslations } from "next-intl";
import { useStores } from "@/api/queries";
import { Button } from "@/shared/ui";
import { Upload } from "lucide-react";

export default function ThemesPage() {
  const t = useTranslations("dashboard.themes");
  const { data: stores } = useStores();
  const activeStore = stores?.[0];
  const [showImport, setShowImport] = useState(false);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
        <Button variant="outline" onClick={() => setShowImport(true)}>
          <Upload className="me-2 h-4 w-4" />
          {t("importTheme") || "Import Theme"}
        </Button>
      </div>
      <ThemeList
        storeId={activeStore?.id}
        activeThemeId={activeStore?.theme}
      />
      {showImport && <ThemeImportDialog onClose={() => setShowImport(false)} />}
    </div>
  );
}
