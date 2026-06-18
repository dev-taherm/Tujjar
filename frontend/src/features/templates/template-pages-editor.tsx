"use client";

import { useState } from "react";
import { Input, Label, Select, Button } from "@/shared/ui";
import { useTranslations } from "next-intl";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight, Copy, Eye, EyeOff, Settings } from "lucide-react";
import { getAllSectionTypes, getRegistryEntry } from "@/builder/sections/registry";
import { sectionComponents } from "@/lib/section-registry";
import { SectionSettingsPanel } from "@/features/pages/section-settings-panel";
import type { Section, SectionDefinition } from "@/shared/types";
import * as Icons from "lucide-react";
import type { ComponentType } from "react";

const PAGE_TYPES = [
  { value: "home", label: "Home" },
  { value: "product", label: "Product" },
  { value: "collection", label: "Collection" },
  { value: "blog", label: "Blog" },
  { value: "custom", label: "Custom" },
  { value: "legal", label: "Legal" },
];

const SECTION_CATEGORIES = [
  { key: "hero", label: "Hero" },
  { key: "products", label: "Products" },
  { key: "content", label: "Content" },
  { key: "social", label: "Social Proof" },
];

interface TemplateSection {
  id?: string;
  type: string;
  settings: Record<string, unknown>;
  visibility?: { desktop: boolean; tablet: boolean; mobile: boolean };
  className?: string;
  customCSS?: string;
}

interface TemplatePage {
  title: string;
  slug: string;
  page_type: string;
  is_published?: boolean;
  sections: TemplateSection[];
}

interface TemplatePagesEditorProps {
  pages: TemplatePage[];
  onChange: (pages: TemplatePage[]) => void;
}

function getIcon(iconName: string) {
  const IconComponent = (Icons as unknown as Record<string, ComponentType<{ className?: string }>>)[iconName];
  return IconComponent || Icons.Box;
}

function SectionCard({
  section,
  index,
  isSelected,
  onSelect,
  onRemove,
  onDuplicate,
  onSettingsToggle,
  showSettings,
}: {
  section: TemplateSection;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onSettingsToggle: () => void;
  showSettings: boolean;
}) {
  const definition = getRegistryEntry(section.type);
  const PreviewComponent = sectionComponents[section.type];

  return (
    <div className={`rounded-lg border transition-colors ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
      <div className="flex items-center gap-2 p-3">
        <GripVertical className="h-4 w-4 flex-shrink-0 cursor-grab text-gray-300" />
        <button onClick={onSelect} className="flex-1 text-left">
          <span className="text-sm font-medium text-gray-900">{definition?.label || section.type}</span>
        </button>
        <div className="flex gap-1">
          <button
            onClick={onSettingsToggle}
            className={`rounded p-1 transition-colors ${showSettings ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:bg-gray-100"}`}
            title="Settings"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDuplicate} className="rounded p-1 text-gray-400 hover:bg-gray-100" title="Duplicate">
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button onClick={onRemove} className="rounded p-1 text-red-400 hover:bg-red-50" title="Remove">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {PreviewComponent && (
        <div className="border-t border-gray-100 bg-gray-50 px-3 py-2">
          <div className="pointer-events-none scale-95 origin-top-left">
            <PreviewComponent section={section} />
          </div>
        </div>
      )}
    </div>
  );
}

function SectionTypePicker({
  onSelect,
  currentSections,
}: {
  onSelect: (type: string) => void;
  currentSections: TemplateSection[];
}) {
  const allTypes = getAllSectionTypes();

  const countsByType = currentSections.reduce<Record<string, number>>((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {SECTION_CATEGORIES.map((cat) => {
        const types = allTypes.filter((t) => t.category === cat.key);
        if (!types.length) return null;
        return (
          <div key={cat.key}>
            <p className="mb-1.5 text-xs font-medium text-gray-500">{cat.label}</p>
            <div className="flex flex-wrap gap-1.5">
              {types.map((def) => {
                const count = countsByType[def.type] || 0;
                const isLimited = def.limit && count >= def.limit;
                const IconComp = getIcon(def.icon);
                return (
                  <button
                    key={def.type}
                    onClick={() => onSelect(def.type)}
                    disabled={!!isLimited}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <IconComp className="h-3.5 w-3.5" />
                    {def.label}
                    {isLimited && <span className="text-gray-400">(max)</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TemplatePagesEditor({ pages, onChange }: TemplatePagesEditorProps) {
  const t = useTranslations("dashboard.templates");
  const [selectedPageIndex, setSelectedPageIndex] = useState<number | null>(null);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<number | null>(null);
  const [showSectionSettings, setShowSectionSettings] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  const selectedPage = selectedPageIndex !== null ? pages[selectedPageIndex] : null;
  const selectedSection = selectedPage && selectedSectionIndex !== null
    ? selectedPage.sections[selectedSectionIndex]
    : null;

  const handlePageChange = (index: number, field: keyof TemplatePage, value: unknown) => {
    const updated = pages.map((p, i) => (i === index ? { ...p, [field]: value } : p));
    onChange(updated);
  };

  const addPage = () => {
    const newPage: TemplatePage = {
      title: "New Page",
      slug: `page-${pages.length + 1}`,
      page_type: "custom",
      sections: [],
    };
    onChange([...pages, newPage]);
    setSelectedPageIndex(pages.length);
    setSelectedSectionIndex(null);
  };

  const removePage = (index: number) => {
    const updated = pages.filter((_, i) => i !== index);
    onChange(updated);
    if (selectedPageIndex === index) {
      setSelectedPageIndex(null);
      setSelectedSectionIndex(null);
    } else if (selectedPageIndex !== null && selectedPageIndex > index) {
      setSelectedPageIndex(selectedPageIndex - 1);
    }
  };

  const movePage = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= pages.length) return;
    const updated = [...pages];
    const [removed] = updated.splice(index, 1);
    updated.splice(newIndex, 0, removed);
    onChange(updated);
    if (selectedPageIndex === index) setSelectedPageIndex(newIndex);
    else if (selectedPageIndex === newIndex) setSelectedPageIndex(index);
  };

  const addSection = (type: string) => {
    if (selectedPageIndex === null) return;
    const newSection: TemplateSection = {
      id: crypto.randomUUID(),
      type,
      settings: {},
      visibility: { desktop: true, tablet: true, mobile: true },
    };
    const updated = pages.map((p, i) =>
      i === selectedPageIndex ? { ...p, sections: [...p.sections, newSection] } : p
    );
    onChange(updated);
    setShowTypePicker(false);
    setSelectedSectionIndex(pages[selectedPageIndex].sections.length);
    setShowSectionSettings(true);
  };

  const removeSection = (pageIdx: number, sectionIdx: number) => {
    const updated = pages.map((p, i) =>
      i === pageIdx ? { ...p, sections: p.sections.filter((_, j) => j !== sectionIdx) } : p
    );
    onChange(updated);
    if (selectedPageIndex === pageIdx && selectedSectionIndex === sectionIdx) {
      setSelectedSectionIndex(null);
      setShowSectionSettings(false);
    }
  };

  const duplicateSection = (pageIdx: number, sectionIdx: number) => {
    const page = pages[pageIdx];
    const original = page.sections[sectionIdx];
    const duplicate: TemplateSection = {
      ...original,
      id: crypto.randomUUID(),
      settings: { ...original.settings },
    };
    const updated = pages.map((p, i) =>
      i === pageIdx
        ? { ...p, sections: [...p.sections.slice(0, sectionIdx + 1), duplicate, ...p.sections.slice(sectionIdx + 1)] }
        : p
    );
    onChange(updated);
  };

  const moveSection = (pageIdx: number, sectionIdx: number, direction: -1 | 1) => {
    const newIndex = sectionIdx + direction;
    const page = pages[pageIdx];
    if (newIndex < 0 || newIndex >= page.sections.length) return;
    const updated = [...pages];
    const sections = [...updated[pageIdx].sections];
    const [removed] = sections.splice(sectionIdx, 1);
    sections.splice(newIndex, 0, removed);
    updated[pageIdx] = { ...updated[pageIdx], sections };
    onChange(updated);
    if (selectedPageIndex === pageIdx && selectedSectionIndex === sectionIdx) {
      setSelectedSectionIndex(newIndex);
    }
  };

  const handleSectionUpdate = (settings: Record<string, unknown>) => {
    if (selectedPageIndex === null || selectedSectionIndex === null) return;
    const updated = pages.map((p, i) =>
      i === selectedPageIndex
        ? {
            ...p,
            sections: p.sections.map((s, j) =>
              j === selectedSectionIndex ? { ...s, settings } : s
            ),
          }
        : p
    );
    onChange(updated);
  };

  return (
    <div className="flex gap-4" style={{ minHeight: "500px" }}>
      {/* Page List (left sidebar) */}
      <div className="w-56 flex-shrink-0">
        <div className="mb-2 flex items-center justify-between">
          <Label>{t("pages")}</Label>
          <button
            onClick={addPage}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-3 w-3" />
            {t("addPage")}
          </button>
        </div>
        <div className="space-y-1">
          {pages.map((page, i) => (
            <div
              key={i}
              className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm transition-colors cursor-pointer ${
                selectedPageIndex === i
                  ? "bg-blue-100 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => { setSelectedPageIndex(i); setSelectedSectionIndex(null); setShowSectionSettings(false); }}
            >
              <GripVertical className="h-3 w-3 flex-shrink-0 text-gray-300 cursor-grab" />
              <span className="flex-1 truncate">{page.title}</span>
              <span className="text-[10px] text-gray-400">{page.sections.length}</span>
              <button
                onClick={(e) => { e.stopPropagation(); movePage(i, -1); }}
                disabled={i === 0}
                className="rounded p-0.5 text-gray-400 hover:bg-gray-200 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); movePage(i, 1); }}
                disabled={i === pages.length - 1}
                className="rounded p-0.5 text-gray-400 hover:bg-gray-200 disabled:opacity-30"
              >
                ↓
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); removePage(i); }}
                className="rounded p-0.5 text-red-400 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          {pages.length === 0 && (
            <p className="py-4 text-center text-xs text-gray-400">{t("noPages")}</p>
          )}
        </div>
      </div>

      {/* Section Editor (main area) */}
      <div className="flex-1 min-w-0">
        {selectedPage ? (
          <div className="space-y-3">
            {/* Page metadata */}
            <div className="grid grid-cols-3 gap-2 rounded-lg border border-gray-200 p-3">
              <div>
                <Label className="text-xs">{t("pageName")}</Label>
                <Input
                  value={selectedPage.title}
                  onChange={(e) => handlePageChange(selectedPageIndex!, "title", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">{t("pageSlug")}</Label>
                <Input
                  value={selectedPage.slug}
                  onChange={(e) => handlePageChange(selectedPageIndex!, "slug", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">{t("pageType")}</Label>
                <Select
                  options={PAGE_TYPES}
                  value={selectedPage.page_type}
                  onChange={(e) => handlePageChange(selectedPageIndex!, "page_type", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Section list */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Sections ({selectedPage.sections.length})</Label>
                <button
                  onClick={() => setShowTypePicker(!showTypePicker)}
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  <Plus className="h-3 w-3" />
                  {t("addSection")}
                </button>
              </div>

              {showTypePicker && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <SectionTypePicker
                    onSelect={addSection}
                    currentSections={selectedPage.sections}
                  />
                </div>
              )}

              {selectedPage.sections.map((section, j) => (
                <div key={section.id} className="flex gap-2">
                  <div className="flex flex-col items-center gap-0.5 pt-1">
                    <button
                      onClick={() => moveSection(selectedPageIndex!, j, -1)}
                      disabled={j === 0}
                      className="rounded p-0.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveSection(selectedPageIndex!, j, 1)}
                      disabled={j === selectedPage.sections.length - 1}
                      className="rounded p-0.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>
                  <div className="flex-1">
                    <SectionCard
                      section={section}
                      index={j}
                      isSelected={selectedSectionIndex === j}
                      onSelect={() => { setSelectedSectionIndex(j); setShowSectionSettings(true); }}
                      onRemove={() => removeSection(selectedPageIndex!, j)}
                      onDuplicate={() => duplicateSection(selectedPageIndex!, j)}
                      onSettingsToggle={() => {
                        if (selectedSectionIndex === j) {
                          setShowSectionSettings(!showSectionSettings);
                        } else {
                          setSelectedSectionIndex(j);
                          setShowSectionSettings(true);
                        }
                      }}
                      showSettings={selectedSectionIndex === j && showSectionSettings}
                    />
                    {selectedSectionIndex === j && showSectionSettings && (
                      <div className="mt-2 rounded-lg border border-gray-200 p-3">
                        <SectionSettingsPanel
                          section={section}
                          onUpdate={handleSectionUpdate}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {selectedPage.sections.length === 0 && !showTypePicker && (
                <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center">
                  <p className="text-sm text-gray-500">{t("noSections")}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-gray-300">
            <p className="text-sm text-gray-500">Select a page to edit its sections</p>
          </div>
        )}
      </div>
    </div>
  );
}
