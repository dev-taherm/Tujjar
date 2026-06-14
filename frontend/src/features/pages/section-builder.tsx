"use client";

import { useState, useCallback } from "react";
import { usePageBuilder } from "@/builder/providers/page-builder-context";
import { useUpdatePage, usePublishPage, useUnpublishPage, useAddSection, useUpdateSection, useRemoveSection, useDuplicateSection, useReorderSections, useToggleSectionVisibility } from "@/api/queries";
import { SectionList } from "./section-list";
import { SectionSettingsPanel } from "./section-settings-panel";
import { SectionTypePicker } from "./section-type-picker";
import { PageToolbar } from "./page-toolbar";
import { VersionHistory } from "./version-history";
import { HeroPreview } from "@/builder/sections/hero";
import { ProductGridPreview } from "@/builder/sections/product-grid";
import { GalleryPreview } from "@/builder/sections/gallery";
import { TestimonialsPreview } from "@/builder/sections/testimonials";
import { FaqPreview } from "@/builder/sections/faq";
import { RichTextPreview } from "@/builder/sections/rich-text";
import { BannerPreview } from "@/builder/sections/banner";
import { NewsletterPreview } from "@/builder/sections/newsletter";
import type { Section } from "@/shared/types";
import { useTranslations } from "next-intl";

const sectionComponents: Record<string, React.ComponentType<{ section: Section }>> = {
  hero: HeroPreview,
  "product-grid": ProductGridPreview,
  gallery: GalleryPreview,
  testimonials: TestimonialsPreview,
  faq: FaqPreview,
  "rich-text": RichTextPreview,
  banner: BannerPreview,
  newsletter: NewsletterPreview,
};

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
  const { page, sections, selectedSectionId, selectSection, getSelectedSection, isDirty, isPreviewMode, togglePreviewMode, editLocale, setEditLocale, getSavePayload } = usePageBuilder();
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

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
      />
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Section List */}
        <div className="w-64 border-e border-gray-200 overflow-y-auto p-3">
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
        </div>

        {/* Center: Preview */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {sections.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <p className="mb-4 text-gray-500">{t("noSections")}</p>
              <button onClick={() => setShowTypePicker(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                {t("addFirstSection")}
              </button>
            </div>
          ) : (
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
          )}
        </div>

        {/* Right: Inspector */}
        {selectedSection && !isPreviewMode && (
          <div className="w-80 border-s border-gray-200 overflow-y-auto p-4">
            <SectionSettingsPanel
              section={selectedSection}
              onUpdate={(settings) => handleUpdateSection(selectedSection.id, settings)}
            />
          </div>
        )}
      </div>

      {showTypePicker && (
        <SectionTypePicker onSelect={handleAddSection} onClose={() => setShowTypePicker(false)} />
      )}

      {showHistory && (
        <VersionHistory pageId={pageId} onClose={() => setShowHistory(false)} />
      )}
    </div>
  );
}
