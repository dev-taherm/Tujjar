"use client";

import { createContext, useCallback, useContext, useState, useMemo, useEffect, useRef } from "react";
import type { Page, Section, PageSchema, ThemeOverride } from "@/shared/types";

interface PageBuilderState {
  page: Page | null;
  sections: Section[];
  selectedSectionId: string | null;
  selectedSectionIds: Set<string>;
  isDirty: boolean;
  isPreviewMode: boolean;
  editLocale: string;
  themeOverride: ThemeOverride | null;
  devicePreview: "desktop" | "tablet" | "mobile";
}

interface PageBuilderContextType extends PageBuilderState {
  setPage: (page: Page | null) => void;
  selectSection: (id: string | null) => void;
  toggleSelectSection: (id: string, ctrlKey: boolean, shiftKey: boolean) => void;
  clearSelection: () => void;
  getSelectedSection: () => Section | null;
  getSelectedSections: () => Section[];
  updatePageSchema: (schema: PageSchema) => void;
  togglePreviewMode: () => void;
  setEditLocale: (locale: string) => void;
  setThemeOverride: (override: ThemeOverride | null) => void;
  setDevicePreview: (device: "desktop" | "tablet" | "mobile") => void;
  getSavePayload: () => { content_schema?: PageSchema; theme_override?: ThemeOverride | null; translations?: Record<string, { title?: string; content_schema?: PageSchema; seo_title?: string; seo_description?: string }> };
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
  const [themeOverride, setThemeOverrideState] = useState<ThemeOverride | null>(
    (initialPage?.theme_override as ThemeOverride) || null
  );
  const [devicePreview, setDevicePreview] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [selectedSectionIds, setSelectedSectionIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  const pageId = initialPage?.id;

  const syncedPageIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (pageId !== syncedPageIdRef.current) {
      syncedPageIdRef.current = pageId;
      setPageState(initialPage);
      setIsDirty(false);
      setLocaleSchemas({});
    }
  }, [pageId, initialPage]);

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
    setSelectedSectionIds(id ? new Set([id]) : new Set());
    setLastSelectedIndex(null);
  }, []);

  const toggleSelectSection = useCallback((id: string, ctrlKey: boolean, shiftKey: boolean) => {
    if (shiftKey && lastSelectedIndex !== null) {
      const currentIndex = sections.findIndex((s) => s.id === id);
      if (currentIndex === -1) return;
      const start = Math.min(lastSelectedIndex, currentIndex);
      const end = Math.max(lastSelectedIndex, currentIndex);
      const rangeIds = sections.slice(start, end + 1).map((s) => s.id);
      setSelectedSectionIds((prev) => {
        const next = new Set(prev);
        rangeIds.forEach((rid) => next.add(rid));
        return next;
      });
      setSelectedSectionId(id);
    } else if (ctrlKey) {
      setSelectedSectionIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
      setSelectedSectionId(id);
      setLastSelectedIndex(sections.findIndex((s) => s.id === id));
    } else {
      setSelectedSectionId(id);
      setSelectedSectionIds(new Set([id]));
      setLastSelectedIndex(sections.findIndex((s) => s.id === id));
    }
  }, [sections, lastSelectedIndex]);

  const clearSelection = useCallback(() => {
    setSelectedSectionId(null);
    setSelectedSectionIds(new Set());
    setLastSelectedIndex(null);
  }, []);

  const getSelectedSection = useCallback((): Section | null => {
    if (!selectedSectionId) return null;
    return sections.find((s) => s.id === selectedSectionId) || null;
  }, [sections, selectedSectionId]);

  const getSelectedSections = useCallback((): Section[] => {
    return sections.filter((s) => selectedSectionIds.has(s.id));
  }, [sections, selectedSectionIds]);

  const updatePageSchema = useCallback((schema: PageSchema) => {
    if (!page) return;
    if (editLocale === "en") {
      setPageState({ ...page, content_schema: schema });
    } else {
      setLocaleSchemas((prev) => ({ ...prev, [editLocale]: schema }));
    }
    setIsDirty(true);
  }, [page, editLocale]);

  const getSavePayload = useCallback((): { content_schema?: PageSchema; theme_override?: ThemeOverride | null; translations?: Record<string, { title?: string; content_schema?: PageSchema; seo_title?: string; seo_description?: string }> } => {
    if (!page) return {};
    const payload: { content_schema?: PageSchema; theme_override?: ThemeOverride | null; translations?: Record<string, { title?: string; content_schema?: PageSchema; seo_title?: string; seo_description?: string }> } = {};
    if (editLocale === "en") {
      payload.content_schema = page.content_schema;
    } else {
      const localeSchema = localeSchemas[editLocale];
      if (localeSchema) {
        payload.translations = {
          ...page.translations,
          [editLocale]: {
            ...(page.translations?.[editLocale] || {}),
            content_schema: localeSchema,
          },
        };
      }
    }
    if (themeOverride !== null) {
      payload.theme_override = themeOverride;
    }
    return payload;
  }, [page, editLocale, localeSchemas, themeOverride]);

  const togglePreviewMode = useCallback(() => {
    setIsPreviewMode((prev) => !prev);
  }, []);

  const setThemeOverride = useCallback((override: ThemeOverride | null) => {
    setThemeOverrideState(override);
    setIsDirty(true);
  }, []);

  const setPageData = useCallback((newPage: Page | null) => {
    setPageState(newPage);
    setSelectedSectionId(null);
    setSelectedSectionIds(new Set());
    setIsDirty(false);
    setLocaleSchemas({});
    setThemeOverrideState((newPage?.theme_override as ThemeOverride) || null);
  }, []);

  return (
    <PageBuilderContext.Provider
      value={{
        page,
        sections,
        selectedSectionId,
        selectedSectionIds,
        isDirty,
        isPreviewMode,
        editLocale,
        themeOverride,
        devicePreview,
        setPage: setPageData,
        selectSection,
        toggleSelectSection,
        clearSelection,
        getSelectedSection,
        getSelectedSections,
        updatePageSchema,
        togglePreviewMode,
        setEditLocale,
        setThemeOverride,
        setDevicePreview,
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
