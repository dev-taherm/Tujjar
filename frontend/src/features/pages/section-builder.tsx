"use client";

import { useState, useCallback } from "react";
import { usePageBuilder } from "@/builder/providers/page-builder-context";
import { useUpdatePage, usePublishPage, useUnpublishPage, useAddSection, useUpdateSection, useRemoveSection, useDuplicateSection, useReorderSections, useToggleSectionVisibility } from "@/api/queries";
import { useAutoSave } from "@/builder/hooks/use-auto-save";
import { useClipboard } from "@/builder/hooks/use-clipboard";
import { useKeyboardShortcuts } from "@/builder/hooks/use-keyboard-shortcuts";
import { pagesApi } from "@/api/pages";
import { ThemePicker } from "./theme-picker";
import { SectionList } from "./section-list";
import { EnhancedInspector } from "@/builder/inspector/enhanced-inspector";
import { SectionTypePicker } from "./section-type-picker";
import { PageToolbar } from "./page-toolbar";
import { VersionHistory } from "./version-history";
import { DeviceFrame } from "@/builder/components/device-frame";
import { LayerTree } from "@/builder/components/layer-tree";
import { sectionComponents } from "@/lib/section-registry";
import type { Section, PageSchema, ThemeOverride } from "@/shared/types";
import { useTranslations } from "next-intl";

function SectionRenderer({ section }: { section: Section }) {
  const t = useTranslations("dashboard.pages");
  const Component = sectionComponents[section.type];
  if (!Component) {
    return <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">{t("unknownSectionType")} {section.type}</div>;
  }
  return <Component section={section} />;
}

interface SectionBuilderProps {
  pageId: string;
}

export function SectionBuilder({ pageId }: SectionBuilderProps) {
  const t = useTranslations("dashboard.pages");
  const tc = useTranslations("common");
  const { page, sections, selectedSectionId, selectSection, getSelectedSection, isDirty, isPreviewMode, togglePreviewMode, editLocale, setEditLocale, themeOverride, setThemeOverride, getSavePayload, devicePreview, setDevicePreview } = usePageBuilder();
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showLayers, setShowLayers] = useState(false);

  const updatePage = useUpdatePage();
  const publishPage = usePublishPage();
  const unpublishPage = useUnpublishPage();
  const addSection = useAddSection();
  const updateSection = useUpdateSection();
  const removeSectionMut = useRemoveSection();
  const duplicateSectionMut = useDuplicateSection();
  const reorderSections = useReorderSections();
  const toggleVisibility = useToggleSectionVisibility();

  const handleSave = useCallback(async () => {
    if (!page) return;
    const payload = getSavePayload();
    if (Object.keys(payload).length === 0) return;
    await updatePage.mutateAsync({ id: page.id, ...payload });
  }, [page, updatePage, getSavePayload]);

  const handleAutoSave = useCallback(async () => {
    if (!page) return;
    const payload: { content_schema?: PageSchema; theme_override?: ThemeOverride } = {};
    if (editLocale === "en") {
      payload.content_schema = page.content_schema;
    }
    if (themeOverride !== null) {
      payload.theme_override = themeOverride;
    }
    await pagesApi.autoSave(page.id, payload as Record<string, unknown>);
  }, [page, editLocale, themeOverride]);

  const { isAutoSaving, lastSavedAt } = useAutoSave(handleAutoSave, isDirty, 5000);

  const handlePublish = useCallback(async () => {
    await publishPage.mutateAsync(pageId);
  }, [pageId, publishPage]);

  const handleUnpublish = useCallback(async () => {
    await unpublishPage.mutateAsync(pageId);
  }, [pageId, unpublishPage]);

  const handleAddSection = useCallback(async (type: string) => {
    await addSection.mutateAsync({ pageId, sectionType: type });
  }, [pageId, addSection]);

  const handleUpdateSection = useCallback(async (sectionId: string, settings: Record<string, unknown>) => {
    await updateSection.mutateAsync({ pageId, sectionId, settings });
  }, [pageId, updateSection]);

  const handleRemoveSection = useCallback(async (sectionId: string) => {
    await removeSectionMut.mutateAsync({ pageId, sectionId });
    if (selectedSectionId === sectionId) selectSection(null);
  }, [pageId, removeSectionMut, selectedSectionId, selectSection]);

  const handleDuplicateSection = useCallback(async (sectionId: string) => {
    await duplicateSectionMut.mutateAsync({ pageId, sectionId });
  }, [pageId, duplicateSectionMut]);

  const handleMoveUp = useCallback(async (index: number) => {
    if (index <= 0) return;
    const ids = sections.map((s) => s.id);
    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
    await reorderSections.mutateAsync({ pageId, sectionIds: ids });
  }, [sections, pageId, reorderSections]);

  const handleMoveDown = useCallback(async (index: number) => {
    if (index >= sections.length - 1) return;
    const ids = sections.map((s) => s.id);
    [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
    await reorderSections.mutateAsync({ pageId, sectionIds: ids });
  }, [sections, pageId, reorderSections]);

  const handleToggleVisibility = useCallback(async (sectionId: string, device: string) => {
    await toggleVisibility.mutateAsync({ pageId, sectionId, device });
  }, [pageId, toggleVisibility]);

  const { copySection, pasteSection } = useClipboard();

  const handleCopySection = useCallback(() => {
    const section = getSelectedSection();
    if (section) copySection(section, pageId);
  }, [getSelectedSection, copySection, pageId]);

  const handlePasteSection = useCallback(async () => {
    const pasted = pasteSection();
    if (pasted && pasted.length > 0) {
      for (const s of pasted) {
        await addSection.mutateAsync({ pageId, sectionType: s.type });
      }
    }
  }, [pasteSection, addSection, pageId]);

  const handleDeleteSection = useCallback(() => {
    if (selectedSectionId) handleRemoveSection(selectedSectionId);
  }, [selectedSectionId, handleRemoveSection]);

  const handleDuplicateSelected = useCallback(() => {
    if (selectedSectionId) handleDuplicateSection(selectedSectionId);
  }, [selectedSectionId, handleDuplicateSection]);

  useKeyboardShortcuts({
    save: handleSave,
    copy: handleCopySection,
    paste: handlePasteSection,
    duplicate: handleDuplicateSelected,
    delete: handleDeleteSection,
    escape: () => selectSection(null),
  });

  const selectedSection = getSelectedSection();

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col rounded-xl border border-gray-200 bg-white overflow-hidden">
      <PageToolbar
        pageTitle={page?.title || ""}
        isPublished={page?.is_published || false}
        version={page?.version || 1}
        isDirty={isDirty}
        isPreviewMode={isPreviewMode}
        editLocale={editLocale}
        onAddSection={() => setShowTypePicker(true)}
        onSave={handleSave}
        onPublish={handlePublish}
        onUnpublish={handleUnpublish}
        onTogglePreview={togglePreviewMode}
        onShowHistory={() => setShowHistory(!showHistory)}
        onLocaleChange={setEditLocale}
        isSaving={updatePage.isPending}
        isAutoSaving={isAutoSaving}
        lastSavedAt={lastSavedAt}
        onThemeClick={() => setShowThemePicker(true)}
        themeOverrideCount={themeOverride ? Object.keys(themeOverride).length : 0}
        devicePreview={devicePreview}
        onDeviceChange={setDevicePreview}
        onToggleLayers={() => setShowLayers(!showLayers)}
        showLayers={showLayers}
      />
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Section List OR Layer Tree */}
        <div className="w-64 border-e border-gray-200 overflow-y-auto p-3">
          {showLayers ? (
            <LayerTree
              sections={sections}
              selectedSectionId={selectedSectionId}
              onSelect={(id) => selectSection(id)}
              onToggleVisibility={handleToggleVisibility}
              device={devicePreview}
            />
          ) : (
            <SectionList
              sections={sections}
              selectedSectionId={selectedSectionId}
              onSelect={selectSection}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onDuplicate={handleDuplicateSection}
              onRemove={handleRemoveSection}
              onToggleVisibility={handleToggleVisibility}
            />
          )}
        </div>

        {/* Center: Preview with Device Frame */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {sections.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <p className="mb-4 text-gray-500">{t("noSections")}</p>
              <button onClick={() => setShowTypePicker(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                {t("addFirstSection")}
              </button>
            </div>
          ) : (
            <DeviceFrame device={devicePreview}>
              <div className="mx-auto max-w-3xl space-y-4">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    onClick={() => selectSection(section.id)}
                    className={`cursor-pointer rounded-lg border-2 transition-colors ${
                      section.id === selectedSectionId ? "border-blue-400" : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <SectionRenderer section={section} />
                  </div>
                ))}
              </div>
            </DeviceFrame>
          )}
        </div>

        {/* Right: Inspector */}
        {selectedSection && !isPreviewMode && (
          <div className="w-80 border-s border-gray-200 overflow-y-auto p-4">
            <EnhancedInspector
              section={selectedSection}
              onUpdate={(settings) => handleUpdateSection(selectedSection.id, settings)}
            />
          </div>
        )}
      </div>

      {showTypePicker && (
        <SectionTypePicker onSelect={handleAddSection} onClose={() => setShowTypePicker(false)} sections={sections} />
      )}

      {showHistory && (
        <VersionHistory pageId={pageId} onClose={() => setShowHistory(false)} />
      )}

      {showThemePicker && (
        <ThemePicker
          currentOverride={themeOverride}
          onSelect={setThemeOverride}
          onClose={() => setShowThemePicker(false)}
        />
      )}
    </div>
  );
}
