"use client";

import { createContext, useCallback, useContext, useState, useMemo, useEffect } from "react";
import type { Page, Section, PageSchema } from "@/shared/types";

interface PageBuilderState {
  page: Page | null;
  sections: Section[];
  selectedSectionId: string | null;
  isDirty: boolean;
  isPreviewMode: boolean;
}

interface PageBuilderContextType extends PageBuilderState {
  setPage: (page: Page | null) => void;
  selectSection: (id: string | null) => void;
  getSelectedSection: () => Section | null;
  updatePageSchema: (schema: PageSchema) => void;
  togglePreviewMode: () => void;
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

  useEffect(() => {
    setPageState(initialPage);
    setIsDirty(false);
  }, [initialPage]);

  const sections = useMemo(
    () => page?.content_schema?.sections || [],
    [page?.content_schema]
  );

  const selectSection = useCallback((id: string | null) => {
    setSelectedSectionId(id);
  }, []);

  const getSelectedSection = useCallback((): Section | null => {
    if (!selectedSectionId) return null;
    return sections.find((s) => s.id === selectedSectionId) || null;
  }, [sections, selectedSectionId]);

  const updatePageSchema = useCallback((schema: PageSchema) => {
    if (!page) return;
    setPageState({ ...page, content_schema: schema });
    setIsDirty(true);
  }, [page]);

  const togglePreviewMode = useCallback(() => {
    setIsPreviewMode((prev) => !prev);
  }, []);

  const setPageData = useCallback((newPage: Page | null) => {
    setPageState(newPage);
    setSelectedSectionId(null);
    setIsDirty(false);
  }, []);

  return (
    <PageBuilderContext.Provider
      value={{
        page,
        sections,
        selectedSectionId,
        isDirty,
        isPreviewMode,
        setPage: setPageData,
        selectSection,
        getSelectedSection,
        updatePageSchema,
        togglePreviewMode,
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
