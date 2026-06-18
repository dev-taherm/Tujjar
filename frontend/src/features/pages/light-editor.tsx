"use client";

import { useState, useCallback } from "react";
import { usePageBuilder } from "@/builder/providers/page-builder-context";
import { useUpdatePage, usePublishPage, useUnpublishPage, useAddSection, useUpdateSection, useRemoveSection, useDuplicateSection, useReorderSections, useToggleSectionVisibility } from "@/api/queries";
import { useAutoSave } from "@/builder/hooks/use-auto-save";
import { useClipboard } from "@/builder/hooks/use-clipboard";
import { useKeyboardShortcuts } from "@/builder/hooks/use-keyboard-shortcuts";
import { pagesApi } from "@/api/pages";
import { SectionTypePicker } from "./section-type-picker";
import { VersionHistory } from "./version-history";
import { DeviceFrame } from "@/builder/components/device-frame";
import { sectionComponents } from "@/lib/section-registry";
import type { Section, PageSchema, ThemeOverride } from "@/shared/types";
import { useTranslations } from "next-intl";
import { Button, Badge, Input } from "@/shared/ui";
import { Plus, Save, Eye, EyeOff, History, ChevronUp, ChevronDown, Copy, Trash2, Palette } from "lucide-react";
import { ThemePicker } from "./theme-picker";
import { getRegistryEntry } from "@/builder/sections/registry";
import type { SettingField } from "@/shared/types";

function SectionCard({ section, isSelected, onSelect, onRemove, onDuplicate, onMoveUp, onMoveDown, isFirst, isLast }: {
  section: Section;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const Component = sectionComponents[section.type];
  return (
    <div
      onClick={onSelect}
      className={`group relative cursor-pointer rounded-lg border-2 transition-all ${
        isSelected ? "border-blue-400 shadow-md" : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
        <span className="text-xs font-medium text-gray-700 capitalize">{section.type.replace(/-/g, " ")}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} disabled={isFirst} className="rounded p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30">
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} disabled={isLast} className="rounded p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30">
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="rounded p-0.5 text-gray-400 hover:text-blue-600">
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="rounded p-0.5 text-gray-400 hover:text-red-600">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="p-3 max-h-48 overflow-hidden">
        {Component ? <Component section={section} /> : <p className="text-xs text-gray-400">Unknown type</p>}
      </div>
    </div>
  );
}

function SimpleInspector({ section, onUpdate }: { section: Section; onUpdate: (settings: Record<string, unknown>) => void }) {
  const t = useTranslations("dashboard.pages");
  const definition = getRegistryEntry(section.type);
  if (!definition) return <p className="text-sm text-gray-500">{t("noSettingsForSection")}</p>;

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 pb-3">
        <h3 className="text-sm font-semibold text-gray-900">{definition.label}</h3>
        <p className="text-xs text-gray-500">{t("configureSection")}</p>
      </div>
      {definition.settingsSchema.map((field: SettingField) => {
        const value = section.settings[field.key];
        return (
          <div key={field.key}>
            <label className="mb-1 block text-xs font-medium text-gray-700">{field.label}</label>
            {field.type === "text" && (
              <Input value={(value as string) || ""} onChange={(e) => onUpdate({ ...section.settings, [field.key]: e.target.value })} />
            )}
            {field.type === "textarea" && (
              <textarea
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={(value as string) || ""}
                onChange={(e) => onUpdate({ ...section.settings, [field.key]: e.target.value })}
                rows={3}
              />
            )}
            {field.type === "number" && (
              <Input type="number" value={String(value || "")} onChange={(e) => onUpdate({ ...section.settings, [field.key]: Number(e.target.value) })} />
            )}
            {field.type === "color" && (
              <div className="flex items-center gap-2">
                <input type="color" value={(value as string) || "#000000"} onChange={(e) => onUpdate({ ...section.settings, [field.key]: e.target.value })} className="h-8 w-8 rounded border" />
                <Input value={(value as string) || ""} onChange={(e) => onUpdate({ ...section.settings, [field.key]: e.target.value })} className="flex-1" />
              </div>
            )}
            {field.type === "toggle" && (
              <button
                onClick={() => onUpdate({ ...section.settings, [field.key]: !value })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? "bg-blue-600" : "bg-gray-200"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            )}
            {field.type === "select" && (
              <select
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={String(value || "")}
                onChange={(e) => onUpdate({ ...section.settings, [field.key]: e.target.value })}
              >
                {(field.options || []).map((opt: { value: string; label: string }) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface LightEditorProps {
  pageId: string;
}

export function LightEditor({ pageId }: LightEditorProps) {
  const t = useTranslations("dashboard.pages");
  const tc = useTranslations("common");
  const { page, sections, selectedSectionId, selectSection, getSelectedSection, isDirty, isPreviewMode, togglePreviewMode, editLocale, setEditLocale, themeOverride, setThemeOverride, getSavePayload, devicePreview, setDevicePreview } = usePageBuilder();
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const updatePage = useUpdatePage();
  const publishPage = usePublishPage();
  const unpublishPage = useUnpublishPage();
  const addSection = useAddSection();
  const updateSection = useUpdateSection();
  const removeSectionMut = useRemoveSection();
  const duplicateSectionMut = useDuplicateSection();
  const reorderSections = useReorderSections();
  const toggleVisibility = useToggleSectionVisibility();
  const { copySection, pasteSection } = useClipboard();

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

  useKeyboardShortcuts({
    save: handleSave,
    escape: () => selectSection(null),
  });

  const selectedSection = getSelectedSection();

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">{page?.title || ""}</h2>
          {page?.is_published ? <Badge variant="success">{tc("published")}</Badge> : <Badge variant="secondary">{tc("draft")}</Badge>}
          {isAutoSaving && <Badge variant="info">Saving...</Badge>}
          {!isAutoSaving && lastSavedAt && !isDirty && (
            <span className="text-xs text-gray-400">Saved {lastSavedAt.toLocaleTimeString()}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowThemePicker(true)}>
            <Palette className="me-1 h-4 w-4" /> {t("theme")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowTypePicker(true)}>
            <Plus className="me-1 h-4 w-4" /> {t("addSection")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
            <History className="me-1 h-4 w-4" /> {t("history")}
          </Button>
          <Button size="sm" onClick={handleSave} isLoading={updatePage.isPending} disabled={!isDirty}>
            <Save className="me-1 h-4 w-4" /> {tc("save")}
          </Button>
          {page?.is_published ? (
            <Button variant="destructive" size="sm" onClick={() => unpublishPage.mutateAsync(pageId)}>{t("unpublish")}</Button>
          ) : (
            <Button size="sm" onClick={() => publishPage.mutateAsync(pageId)}>{t("publish")}</Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Section List */}
        <div className="w-72 border-e border-gray-200 overflow-y-auto p-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">{t("sections")} ({sections.length})</h3>
            <button onClick={() => setShowTypePicker(true)} className="text-xs text-blue-600 hover:text-blue-700">+ Add</button>
          </div>
          {sections.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
              <p className="mb-2 text-sm text-gray-500">{t("noSections")}</p>
              <button onClick={() => setShowTypePicker(true)} className="text-sm font-medium text-blue-600 hover:text-blue-700">{t("addFirstSection")}</button>
            </div>
          ) : (
            <div className="space-y-2">
              {sections.map((section, index) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  isSelected={section.id === selectedSectionId}
                  onSelect={() => selectSection(section.id)}
                  onRemove={() => handleRemoveSection(section.id)}
                  onDuplicate={() => handleDuplicateSection(section.id)}
                  onMoveUp={() => handleMoveUp(index)}
                  onMoveDown={() => handleMoveDown(index)}
                  isFirst={index === 0}
                  isLast={index === sections.length - 1}
                />
              ))}
            </div>
          )}
        </div>

        {/* Center: Preview */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <DeviceFrame device={devicePreview}>
            {sections.length === 0 ? (
              <div className="flex h-96 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300">
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
                    {(() => {
                      const Component = sectionComponents[section.type];
                      return Component ? <Component section={section} /> : null;
                    })()}
                  </div>
                ))}
              </div>
            )}
          </DeviceFrame>
        </div>

        {/* Right: Simple Inspector */}
        {selectedSection && !isPreviewMode && (
          <div className="w-80 border-s border-gray-200 overflow-y-auto p-4">
            <SimpleInspector
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
        <ThemePicker currentOverride={themeOverride} onSelect={setThemeOverride} onClose={() => setShowThemePicker(false)} />
      )}
    </div>
  );
}
