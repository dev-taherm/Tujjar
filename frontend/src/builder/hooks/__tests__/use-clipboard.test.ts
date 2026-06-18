import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useClipboard } from "../use-clipboard";
import type { Section } from "@/shared/types";

function makeSection(overrides: Partial<Section> = {}): Section {
  return {
    id: overrides.id || "test-id",
    type: overrides.type || "hero",
    settings: overrides.settings || {},
    visibility: { desktop: true, tablet: true, mobile: true },
  };
}

describe("useClipboard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes with no clipboard data", () => {
    const { result } = renderHook(() => useClipboard());
    expect(result.current.hasClipboard).toBe(false);
    expect(result.current.clipboardPageId).toBeNull();
    expect(result.current.clipboardSectionType).toBeNull();
  });

  it("copySection stores section in localStorage", () => {
    const { result } = renderHook(() => useClipboard());
    const section = makeSection({ id: "sec-1", type: "hero" });

    act(() => {
      result.current.copySection(section, "page-1");
    });

    expect(result.current.hasClipboard).toBe(true);
    expect(result.current.clipboardPageId).toBe("page-1");
    expect(result.current.clipboardSectionType).toBe("hero");
  });

  it("pasteSection returns cloned sections with new UUIDs", () => {
    const { result } = renderHook(() => useClipboard());
    const section = makeSection({ id: "sec-1", type: "hero" });

    act(() => {
      result.current.copySection(section, "page-1");
    });

    let pasted: Section[] | null = null;
    act(() => {
      pasted = result.current.pasteSection();
    });

    expect(pasted).not.toBeNull();
    expect(pasted).toHaveLength(1);
    expect(pasted![0].type).toBe("hero");
    expect(pasted![0].id).not.toBe("sec-1");
  });

  it("pasteSection returns null when clipboard is empty", () => {
    const { result } = renderHook(() => useClipboard());

    let pasted: Section[] | null = null;
    act(() => {
      pasted = result.current.pasteSection();
    });

    expect(pasted).toBeNull();
  });

  it("copySection deep clones the section", () => {
    const { result } = renderHook(() => useClipboard());
    const settings = { title: "Original" };
    const section = makeSection({ id: "sec-1", settings });

    act(() => {
      result.current.copySection(section, "page-1");
    });

    const stored = JSON.parse(localStorage.getItem("page-builder-clipboard") || "{}");
    expect(stored.sections[0].settings.title).toBe("Original");
    stored.sections[0].settings.title = "Modified";
    expect(section.settings.title).toBe("Original");
  });
});
