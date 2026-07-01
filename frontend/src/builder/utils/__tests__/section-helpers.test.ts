import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateSectionId,
  createSectionFromDefinition,
  moveSectionUp,
  moveSectionDown,
  duplicateSection,
  removeSection,
  updateSectionSettings,
  toggleSectionVisibility,
} from "../section-helpers";
import type { Section, SectionDefinition } from "@/shared/types";

vi.mock("crypto", () => ({
  randomUUID: () => "test-uuid-123",
}));

function makeSection(overrides: Partial<Section> = {}): Section {
  return {
    id: overrides.id || "section-1",
    type: "hero",
    settings: overrides.settings || {},
    visibility: overrides.visibility || { desktop: true, tablet: true, mobile: true },
    className: "",
    customCSS: "",
    ...overrides,
  };
}

describe("generateSectionId", () => {
  it("generates a string id", () => {
    const id = generateSectionId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });
});

describe("createSectionFromDefinition", () => {
  it("creates a section from a definition", () => {
    const definition: SectionDefinition = {
      type: "features",
      label: "Features",
      icon: "star",
      defaultSettings: { title: "Our Features", columns: 3 },
      settingsSchema: [],
      category: "content",
    };

    const section = createSectionFromDefinition(definition);

    expect(section.type).toBe("features");
    expect(section.settings).toEqual({ title: "Our Features", columns: 3 });
    expect(section.visibility).toEqual({ desktop: true, tablet: true, mobile: true });
    expect(section.id).toBeTruthy();
  });

  it("creates section with empty settings when definition has none", () => {
    const definition: SectionDefinition = {
      type: "hero",
      label: "Hero",
      icon: "image",
      defaultSettings: {},
      settingsSchema: [],
      category: "hero",
    };

    const section = createSectionFromDefinition(definition);
    expect(section.settings).toEqual({});
  });
});

describe("moveSectionUp", () => {
  const sections = [makeSection({ id: "a" }), makeSection({ id: "b" }), makeSection({ id: "c" })];

  it("moves section up by one position", () => {
    const result = moveSectionUp(sections, 1);
    expect(result[0].id).toBe("b");
    expect(result[1].id).toBe("a");
    expect(result[2].id).toBe("c");
  });

  it("does not move first section up", () => {
    const result = moveSectionUp(sections, 0);
    expect(result.map((s) => s.id)).toEqual(["a", "b", "c"]);
  });

  it("returns same array reference when at index 0", () => {
    const result = moveSectionUp(sections, 0);
    expect(result).toBe(sections);
  });
});

describe("moveSectionDown", () => {
  const sections = [makeSection({ id: "a" }), makeSection({ id: "b" }), makeSection({ id: "c" })];

  it("moves section down by one position", () => {
    const result = moveSectionDown(sections, 0);
    expect(result[0].id).toBe("b");
    expect(result[1].id).toBe("a");
    expect(result[2].id).toBe("c");
  });

  it("does not move last section down", () => {
    const result = moveSectionDown(sections, 2);
    expect(result.map((s) => s.id)).toEqual(["a", "b", "c"]);
  });

  it("returns same array reference when at last index", () => {
    const result = moveSectionDown(sections, 2);
    expect(result).toBe(sections);
  });
});

describe("duplicateSection", () => {
  it("duplicates a section after the original", () => {
    const sections = [makeSection({ id: "a" }), makeSection({ id: "b" })];
    const result = duplicateSection(sections, "a");

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe("a");
    expect(result[1].id).not.toBe("a");
    expect(result[1].type).toBe("a" === "a" ? "hero" : "hero");
    expect(result[2].id).toBe("b");
  });

  it("returns original array if section not found", () => {
    const sections = [makeSection({ id: "a" })];
    const result = duplicateSection(sections, "nonexistent");
    expect(result).toBe(sections);
  });

  it("deep clones the section", () => {
    const section = makeSection({
      id: "original",
      settings: { nested: { value: 1 } },
    });
    const result = duplicateSection([section], "original");
    const clone = result[1];

    expect(clone.settings).toEqual(section.settings);
    expect(clone.settings).not.toBe(section.settings);
  });
});

describe("removeSection", () => {
  it("removes a section by id", () => {
    const sections = [makeSection({ id: "a" }), makeSection({ id: "b" }), makeSection({ id: "c" })];
    const result = removeSection(sections, "b");
    expect(result).toHaveLength(2);
    expect(result.map((s) => s.id)).toEqual(["a", "c"]);
  });

  it("returns same array if section not found", () => {
    const sections = [makeSection({ id: "a" })];
    const result = removeSection(sections, "nonexistent");
    expect(result).toHaveLength(1);
  });
});

describe("updateSectionSettings", () => {
  it("merges new settings into existing settings", () => {
    const section = makeSection({
      id: "s1",
      settings: { title: "Old Title", color: "blue" },
    });
    const result = updateSectionSettings([section], "s1", { title: "New Title" });

    expect(result[0].settings).toEqual({ title: "New Title", color: "blue" });
  });

  it("adds new settings that did not exist", () => {
    const section = makeSection({ id: "s1", settings: {} });
    const result = updateSectionSettings([section], "s1", { padding: 16 });

    expect(result[0].settings).toEqual({ padding: 16 });
  });

  it("does not modify other sections", () => {
    const s1 = makeSection({ id: "s1", settings: { a: 1 } });
    const s2 = makeSection({ id: "s2", settings: { b: 2 } });
    const result = updateSectionSettings([s1, s2], "s1", { a: 99 });

    expect(result[1].settings).toEqual({ b: 2 });
  });
});

describe("toggleSectionVisibility", () => {
  it("toggles desktop visibility", () => {
    const section = makeSection({
      id: "s1",
      visibility: { desktop: true, tablet: true, mobile: true },
    });
    const result = toggleSectionVisibility([section], "s1", "desktop");
    expect(result[0].visibility.desktop).toBe(false);
  });

  it("toggles tablet visibility", () => {
    const section = makeSection({
      id: "s1",
      visibility: { desktop: true, tablet: true, mobile: true },
    });
    const result = toggleSectionVisibility([section], "s1", "tablet");
    expect(result[0].visibility.tablet).toBe(false);
  });

  it("toggles mobile visibility", () => {
    const section = makeSection({
      id: "s1",
      visibility: { desktop: true, tablet: true, mobile: true },
    });
    const result = toggleSectionVisibility([section], "s1", "mobile");
    expect(result[0].visibility.mobile).toBe(false);
  });

  it("defaults to true when visibility is undefined", () => {
    const section = makeSection({ id: "s1", visibility: undefined as unknown as Section["visibility"] });
    const result = toggleSectionVisibility([section], "s1", "desktop");
    expect(result[0].visibility.desktop).toBe(false);
  });

  it("does not modify other sections", () => {
    const s1 = makeSection({
      id: "s1",
      visibility: { desktop: true, tablet: true, mobile: true },
    });
    const s2 = makeSection({
      id: "s2",
      visibility: { desktop: true, tablet: true, mobile: true },
    });
    const result = toggleSectionVisibility([s1, s2], "s1", "desktop");

    expect(result[1].visibility.desktop).toBe(true);
  });
});
