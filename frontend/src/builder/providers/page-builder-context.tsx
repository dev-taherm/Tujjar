"use client";

import { createContext, useCallback, useContext, useState, useMemo, useEffect } from "react";
import type { Page, Section, PageSchema } from "@/shared/types";

interface PageBuilderState {
  page: Page | null;
  sections: Section[];
  selectedSectionId: string | null;
  isDirty: boolean;
  isPreviewMode: boolean;
  editLocale: string;
}

interface PageBuilderContextType extends PageBuilderState {
  setPage: (page: Page | null) => void;
  selectSection: (id: string | null) => void;
  getSelectedSection: () => Section | null;
  updatePageSchema: (schema: PageSchema) => void;
  togglePreviewMode: () => void;
  setEditLocale: (locale: string) => void;
  getSavePayload: () => { content_schema?: PageSchema; translations?: Record<string, { title?: string; content_schema?: PageSchema; seo_title?: string; seo_description?: string }> };
}

const PageBuilderContext = createContext<PageBuilderContextType | null>(null);

interface PageBuilderProviderProps {
  page: Page;
  children: React.ReactNode;
}

export function PageBuilderProvider({ page: initialPage, children }: PageBuilderProviderProps) {
  const [page, setPageState] = useState<Page | null>(initialPage);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [editLocale, setEditLocaleState] = useState("en");
  const [localeSchemas, setLocaleSchemas] = useState<Record<string, PageSchema>>({});

  useEffect(() => {
    setPageState(initialPage);
    setIsDirty(false);
    setLocaleSchemas({});
  }, [initialPage]);

  const setEditLocale = useCallback((locale: string) => {
    setEditLocaleState(locale);
    setSelectedSectionId(null);
  }, []);

  const sections = useMemo(() => {
    if (editLocale === "en") {
      return page?.content_schema?.sections || [];
    }
    return localeSchemas[editLocale]?.sections || page?.content_schema?.sections || [];
  }, [page?.content_schema, editLocale, localeSchemas]);

  const selectSection = useCallback((id: string | null) => {
    setSelectedSectionId(id);
  }, []);

  const getSelectedSection = useCallback((): Section | null => {
    if (!selectedSectionId) return null;
    return sections.find((s) => s.id === selectedSectionId) || null;
  }, [sections, selectedSectionId]);

  const updatePageSchema = useCallback((schema: PageSchema) => {
    if (!page) return;
    if (editLocale === "en") {
      setPageState({ ...page, content_schema: schema });
    } else {
      setLocaleSchemas((prev) => ({ ...prev, [editLocale]: schema }));
    }
    setIsDirty(true);
  }, [page, editLocale]);

  const getSavePayload = useCallback((): { content_schema?: PageSchema; translations?: Record<string, { title?: string; content_schema?: PageSchema; seo_title?: string; seo_description?: string }> } => {
    if (!page) return {};
    if (editLocale === "en") {
      return { content_schema: page.content_schema };
    }
    const localeSchema = localeSchemas[editLocale];
    if (!localeSchema) return {};
    return {
      translations: {
        ...page.translations,
        [editLocale]: {
          ...(page.translations?.[editLocale] || {}),
          content_schema: localeSchema,
        },
      },
    };
  }, [page, editLocale, localeSchemas]);

  const togglePreviewMode = useCallback(() => {
    setIsPreviewMode((prev) => !prev);
  }, []);

  const setPageData = useCallback((newPage: Page | null) => {
    setPageState(newPage);
    setSelectedSectionId(null);
    setIsDirty(false);
    setLocaleSchemas({});
  }, []);

  return (
    <PageBuilderContext.Provider
      value={{
        page,
        sections,
        selectedSectionId,
        isDirty,
        isPreviewMode,
        editLocale,
        setPage: setPageData,
        selectSection,
        getSelectedSection,
        updatePageSchema,
        togglePreviewMode,
        setEditLocale,
        getSavePayload,
      }}
    >
      {children}
    </PageBuilderContext.Provider>
  );
}

export function usePageBuilder() {
  const context = useContext(PageBuilderContext);
  if (!context) {
    throw new Error("usePageBuilder must be used within a PageBuilderProvider");
  }
  return context;
}
