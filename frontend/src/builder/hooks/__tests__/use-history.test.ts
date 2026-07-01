import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHistory } from "../use-history";
import type { PageSchema, Section } from "@/shared/types";

function makeSchema(overrides: Partial<PageSchema> = {}): PageSchema {
  return {
    sections: overrides.sections || [],
  };
}

function makeSection(id: string, type: string): Section {
  return { id, type } as Section;
}

describe("useHistory", () => {
  it("initializes with the provided schema", () => {
    const initial = makeSchema();
    const { result } = renderHook(() => useHistory(initial));

    expect(result.current.schema).toEqual(initial);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("set updates the present schema", () => {
    const initial = makeSchema({ sections: [makeSection("s1", "hero")] });
    const { result } = renderHook(() => useHistory(initial));

    const updated = makeSchema({ sections: [makeSection("s2", "features")] });
    act(() => {
      result.current.set(updated);
    });

    expect(result.current.schema).toEqual(updated);
    expect(result.current.canUndo).toBe(true);
  });

  it("undo reverts to previous schema", () => {
    const initial = makeSchema({ sections: [makeSection("s1", "hero")] });
    const { result } = renderHook(() => useHistory(initial));

    const updated = makeSchema({ sections: [makeSection("s2", "features")] });
    act(() => {
      result.current.set(updated);
    });

    act(() => {
      result.current.undo();
    });

    expect(result.current.schema).toEqual(initial);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it("redo moves forward to undone schema", () => {
    const initial = makeSchema({ sections: [makeSection("s1", "hero")] });
    const { result } = renderHook(() => useHistory(initial));

    const updated = makeSchema({ sections: [makeSection("s2", "features")] });
    act(() => {
      result.current.set(updated);
    });

    act(() => {
      result.current.undo();
    });

    act(() => {
      result.current.redo();
    });

    expect(result.current.schema).toEqual(updated);
    expect(result.current.canRedo).toBe(false);
  });

  it("undo does nothing when no past", () => {
    const initial = makeSchema();
    const { result } = renderHook(() => useHistory(initial));

    act(() => {
      result.current.undo();
    });

    expect(result.current.schema).toEqual(initial);
  });

  it("redo does nothing when no future", () => {
    const initial = makeSchema();
    const { result } = renderHook(() => useHistory(initial));

    act(() => {
      result.current.redo();
    });

    expect(result.current.schema).toEqual(initial);
  });

  it("set clears future history", () => {
    const initial = makeSchema({ sections: [makeSection("s1", "hero")] });
    const { result } = renderHook(() => useHistory(initial));

    const v2 = makeSchema({ sections: [makeSection("s2", "features")] });
    const v3 = makeSchema({ sections: [makeSection("s3", "faq")] });

    act(() => {
      result.current.set(v2);
    });

    act(() => {
      result.current.undo();
    });

    act(() => {
      result.current.set(v3);
    });

    expect(result.current.schema).toEqual(v3);
    expect(result.current.canRedo).toBe(false);
  });

  it("supports multiple undo/redo steps", () => {
    const initial = makeSchema({ sections: [makeSection("s1", "hero")] });
    const v2 = makeSchema({ sections: [makeSection("s2", "features")] });
    const v3 = makeSchema({ sections: [makeSection("s3", "faq")] });

    const { result } = renderHook(() => useHistory(initial));

    act(() => {
      result.current.set(v2);
    });

    act(() => {
      result.current.set(v3);
    });

    act(() => {
      result.current.undo();
    });
    expect(result.current.schema).toEqual(v2);

    act(() => {
      result.current.undo();
    });
    expect(result.current.schema).toEqual(initial);

    act(() => {
      result.current.redo();
    });
    expect(result.current.schema).toEqual(v2);

    act(() => {
      result.current.redo();
    });
    expect(result.current.schema).toEqual(v3);
  });
});
