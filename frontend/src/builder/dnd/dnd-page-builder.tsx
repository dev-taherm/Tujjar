"use client";

import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay as DndDragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { usePageBuilder } from "@/builder/providers/page-builder-context";
import { useUpdatePage, usePublishPage, useUnpublishPage, useAddSection, useUpdateSection, useRemoveSection, useDuplicateSection, useReorderSections, useToggleSectionVisibility } from "@/api/queries";
import { SortableSection } from "./sortable-section";
import { DropZone } from "./drop-zone";
import { SectionPalette } from "./section-palette";
import { DragOverlay } from "./drag-overlay";
import { EnhancedInspector } from "@/builder/inspector/enhanced-inspector";
import { ThemePicker } from "@/features/pages/theme-picker";
import { PageToolbar } from "@/features/pages/page-toolbar";
import { VersionHistory } from "@/features/pages/version-history";
import { DeviceFrame } from "@/builder/components/device-frame";
import { LayerTree } from "@/builder/components/layer-tree";
import { useHistory } from "@/builder/hooks/use-history";
import { useAutoSave } from "@/builder/hooks/use-auto-save";
import { useClipboard } from "@/builder/hooks/use-clipboard";
import { useKeyboardShortcuts } from "@/builder/hooks/use-keyboard-shortcuts";
import { pagesApi } from "@/api/pages";
import { sectionComponents } from "@/lib/section-registry";
import type { Section } from "@/shared/types";
import { Undo2, Redo2 } from "lucide-react";

function SectionRenderer({ section }: { section: Section }) {
  const Component = sectionComponents[section.type];
  if (!Component) {
    return <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">Unknown section type: {section.type}</div>;
  }
  return <Component section={section} />;
}

interface DndPageBuilderProps {
  pageId: string;
}

export function DndPageBuilder({ pageId }: DndPageBuilderProps) {
  const { page, sections, selectedSectionId, selectSection, getSelectedSection, isPreviewMode, togglePreviewMode, isDirty, editLocale, setEditLocale, themeOverride, setThemeOverride, getSavePayload, devicePreview, setDevicePreview } = usePageBuilder();
  const [activeDragType, setActiveDragType] = useState<string | null>(null);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [insertPosition, setInsertPosition] = useState<number | null>(null);

  const initialSchema = useMemo(() => {
    return page?.content_schema || { sections: [] };
  }, [page?.content_schema]);

  const { schema, set: setSchema, undo, redo, canUndo, canRedo } = useHistory(initialSchema);
  const { copySection, pasteSection, hasClipboard, clipboardSectionType } = useClipboard();

  const updatePage = useUpdatePage();
  const publishPage = usePublishPage();
  const unpublishPage = useUnpublishPage();
  const addSection = useAddSection();
  const updateSection = useUpdateSection();
  const removeSectionMut = useRemoveSection();
  const duplicateSectionMut = useDuplicateSection();
  const reorderSections = useReorderSections();
  const toggleVisibility = useToggleSectionVisibility();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const sortedSections = useMemo(() => {
    return schema.sections || [];
  }, [schema.sections]);

  const handleAddSectionAtPosition = useCallback(async (type: string, position: number) => {
    await addSection.mutateAsync({ pageId, sectionType: type, position });
  }, [pageId, addSection]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current;
    if (data?.type === "palette") {
      setActiveDragType(data.sectionType);
    } else {
      const section = sortedSections.find((s) => s.id === active.id);
      if (section) setActiveDragType(section.type);
    }
  }, [sortedSections]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragType(null);

    if (!over) return;

    const data = active.data.current;

    if (data?.type === "palette") {
      const overId = String(over.id);
      if (overId.startsWith("drop-zone-")) {
        const position = parseInt(overId.replace("drop-zone-", ""), 10);
        handleAddSectionAtPosition(data.sectionType, position);
      } else {
        const idx = sortedSections.findIndex((s) => s.id === over.id);
        handleAddSectionAtPosition(data.sectionType, idx + 1);
      }
      return;
    }

    if (active.id !== over.id) {
      const oldIndex = sortedSections.findIndex((s) => s.id === active.id);
      const newIndex = sortedSections.findIndex((s) => s.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(sortedSections, oldIndex, newIndex);
        setSchema({ ...schema, sections: reordered });
      }
    }
  }, [sortedSections, schema, setSchema, handleAddSectionAtPosition]);

  const handleAddSection = useCallback(async (type: string) => {
    await addSection.mutateAsync({ pageId, sectionType: type });
  }, [pageId, addSection]);

  const handleSave = useCallback(async () => {
    if (!page) return;
    const payload: { content_schema?: Record<string, unknown>; theme_override?: Record<string, unknown>; translations?: Record<string, unknown> } = {};
    if (editLocale === "en") {
      payload.content_schema = schema;
    } else {
      payload.translations = {
        ...page.translations,
        [editLocale]: { ...(page.translations?.[editLocale] || {}), content_schema: schema },
      };
    }
    if (themeOverride !== null) {
      payload.theme_override = themeOverride;
    }
    await updatePage.mutateAsync({ id: page.id, ...payload });
  }, [page, schema, updatePage, editLocale, themeOverride]);

  const handleAutoSave = useCallback(async () => {
    if (!page) return;
    const payload: { content_schema?: Record<string, unknown>; theme_override?: Record<string, unknown> } = { content_schema: schema };
    if (themeOverride !== null) {
      payload.theme_override = themeOverride;
    }
    await pagesApi.autoSave(page.id, payload);
  }, [page, schema, themeOverride]);

  const { isAutoSaving, lastSavedAt } = useAutoSave(handleAutoSave, isDirty, 5000);

  const handlePublish = useCallback(async () => {
    await publishPage.mutateAsync(pageId);
  }, [pageId, publishPage]);

  const handleUnpublish = useCallback(async () => {
    await unpublishPage.mutateAsync(pageId);
  }, [pageId, unpublishPage]);

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

  const handleToggleVisibility = useCallback(async (sectionId: string, device: string) => {
    await toggleVisibility.mutateAsync({ pageId, sectionId, device });
  }, [pageId, toggleVisibility]);

  const handleCopySection = useCallback(() => {
    const section = getSelectedSection();
    if (section) copySection(section, pageId);
  }, [getSelectedSection, copySection, pageId]);

  const handlePasteSection = useCallback(async () => {
    const sections = pasteSection();
    if (sections && sections.length > 0) {
      for (const s of sections) {
        await addSection.mutateAsync({ pageId, sectionType: s.type });
      }
    }
  }, [pasteSection, addSection, pageId]);

  const handleDeleteSection = useCallback(() => {
    if (selectedSectionId) {
      handleRemoveSection(selectedSectionId);
    }
  }, [selectedSectionId, handleRemoveSection]);

  const handleDuplicateSelected = useCallback(() => {
    if (selectedSectionId) {
      handleDuplicateSection(selectedSectionId);
    }
  }, [selectedSectionId, handleDuplicateSection]);

  useKeyboardShortcuts({
    undo,
    redo,
    save: handleSave,
    copy: handleCopySection,
    paste: handlePasteSection,
    duplicate: handleDuplicateSelected,
    delete: handleDeleteSection,
    escape: () => selectSection(null),
  });

  const selectedSection = getSelectedSection();

  const sortedSectionsForLayers = useMemo(() => {
    return sortedSections;
  }, [sortedSections]);

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
        {/* Left: Section Palette OR Layer Tree */}
        <div className="w-56 border-e border-gray-200 overflow-y-auto p-3">
          {showLayers ? (
            <LayerTree
              sections={sortedSectionsForLayers}
              selectedSectionId={selectedSectionId}
              onSelect={(id) => selectSection(id)}
              onToggleVisibility={handleToggleVisibility}
              device={devicePreview}
            />
          ) : (
            <SectionPalette onAddSection={handleAddSection} sections={sortedSections} />
          )}
        </div>

        {/* Center: DnD Canvas with Device Frame */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="mx-auto max-w-3xl">
            <div className="mb-4 flex items-center justify-end gap-2">
              <button onClick={undo} disabled={!canUndo} className="rounded-md border border-gray-200 bg-white p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-30">
                <Undo2 className="h-4 w-4" />
              </button>
              <button onClick={redo} disabled={!canRedo} className="rounded-md border border-gray-200 bg-white p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-30">
                <Redo2 className="h-4 w-4" />
              </button>
            </div>

            {sortedSections.length === 0 ? (
              <div className="flex h-96 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300">
                <p className="mb-4 text-gray-500">Drag sections here or click &quot;Add Section&quot;</p>
                <button onClick={() => setShowTypePicker(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                  Add Your First Section
                </button>
              </div>
            ) : (
              <DeviceFrame device={devicePreview}>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={sortedSections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      <DropZone id="drop-zone-0" onAddSection={() => setShowTypePicker(true)} />
                      {sortedSections.map((section, index) => (
                        <div key={section.id}>
                          <SortableSection
                            section={section}
                            isSelected={section.id === selectedSectionId}
                            onSelect={() => selectSection(section.id)}
                            onDuplicate={() => handleDuplicateSection(section.id)}
                            onRemove={() => handleRemoveSection(section.id)}
                            onToggleVisibility={(device) => handleToggleVisibility(section.id, device)}
                          >
                            <SectionRenderer section={section} />
                          </SortableSection>
                          <DropZone id={`drop-zone-${index + 1}`} onAddSection={() => setShowTypePicker(true)} />
                        </div>
                      ))}
                    </div>
                  </SortableContext>
                  <DndDragOverlay>
                    {activeDragType ? <DragOverlay type={activeDragType} /> : null}
                  </DndDragOverlay>
                </DndContext>
              </DeviceFrame>
            )}
          </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-semibold">Add Section</h2>
            <SectionPalette onAddSection={(type) => { handleAddSection(type); setShowTypePicker(false); }} sections={sortedSections} />
            <button onClick={() => setShowTypePicker(false)} className="mt-4 w-full rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
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
