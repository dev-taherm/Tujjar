import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHistory } from "../use-history";
import type { PageSchema } from "@/shared/types";

function makeSchema(overrides: Partial<PageSchema> = {}): PageSchema {
  return {
    sections: overrides.sections || [],
  };
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
    const initial = makeSchema({ sections: [{ id: "s1", type: "hero" } as any] });
    const { result } = renderHook(() => useHistory(initial));

    const updated = makeSchema({ sections: [{ id: "s2", type: "features" } as any] });
    act(() => {
      result.current.set(updated);
    });

    expect(result.current.schema).toEqual(updated);
    expect(result.current.canUndo).toBe(true);
  });

  it("undo reverts to previous schema", () => {
    const initial = makeSchema({ sections: [{ id: "s1" } as any] });
    const { result } = renderHook(() => useHistory(initial));

    const updated = makeSchema({ sections: [{ id: "s2" } as any] });
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
    const initial = makeSchema({ sections: [{ id: "s1" } as any] });
    const { result } = renderHook(() => useHistory(initial));

    const updated = makeSchema({ sections: [{ id: "s2" } as any] });
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
    const initial = makeSchema({ sections: [{ id: "s1" } as any] });
    const { result } = renderHook(() => useHistory(initial));

    const v2 = makeSchema({ sections: [{ id: "s2" } as any] });
    const v3 = makeSchema({ sections: [{ id: "s3" } as any] });

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
    const initial = makeSchema({ sections: [{ id: "s1" } as any] });
    const v2 = makeSchema({ sections: [{ id: "s2" } as any] });
    const v3 = makeSchema({ sections: [{ id: "s3" } as any] });

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
