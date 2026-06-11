import type { Section, SectionDefinition, PageSchema } from "@/shared/types";

export function generateSectionId(): string {
  return crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15);
}

export function createSectionFromDefinition(definition: SectionDefinition): Section {
  return {
    id: generateSectionId(),
    type: definition.type,
    settings: { ...definition.defaultSettings },
    visibility: { desktop: true, tablet: true, mobile: true },
    className: "",
    customCSS: "",
  };
}

export function moveSectionUp(sections: Section[], index: number): Section[] {
  if (index <= 0) return sections;
  const newSections = [...sections];
  [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
  return newSections;
}

export function moveSectionDown(sections: Section[], index: number): Section[] {
  if (index >= sections.length - 1) return sections;
  const newSections = [...sections];
  [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
  return newSections;
}

export function duplicateSection(sections: Section[], sectionId: string): Section[] {
  const index = sections.findIndex((s) => s.id === sectionId);
  if (index === -1) return sections;
  const original = sections[index];
  const clone: Section = {
    ...JSON.parse(JSON.stringify(original)),
    id: generateSectionId(),
  };
  const newSections = [...sections];
  newSections.splice(index + 1, 0, clone);
  return newSections;
}

export function removeSection(sections: Section[], sectionId: string): Section[] {
  return sections.filter((s) => s.id !== sectionId);
}

export function updateSectionSettings(
  sections: Section[],
  sectionId: string,
  settings: Record<string, unknown>
): Section[] {
  return sections.map((s) =>
    s.id === sectionId ? { ...s, settings: { ...s.settings, ...settings } } : s
  );
}

export function toggleSectionVisibility(
  sections: Section[],
  sectionId: string,
  device: "desktop" | "tablet" | "mobile"
): Section[] {
  return sections.map((s) =>
    s.id === sectionId
      ? {
          ...s,
          visibility: {
            ...s.visibility,
            [device]: !s.visibility[device],
          },
        }
      : s
  );
}
