"use client";

import { useCallback, useRef, useState } from "react";
import type { PageSchema } from "@/shared/types";

interface HistoryState {
  past: PageSchema[];
  present: PageSchema;
  future: PageSchema[];
}

export function useHistory(initial: PageSchema) {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: initial,
    future: [],
  });
  const batchRef = useRef(false);

  const set = useCallback((schema: PageSchema, batch = false) => {
    if (batch) {
      batchRef.current = true;
      setHistory((prev) => ({
        past: [...prev.past, prev.present],
        present: schema,
        future: [],
      }));
      return;
    }
    setHistory((prev) => ({
      past: [...prev.past, prev.present],
      present: schema,
      future: [],
    }));
  }, []);

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      return {
        past: prev.past.slice(0, -1),
        present: previous,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: prev.future.slice(1),
      };
    });
  }, []);

  return {
    schema: history.present,
    set,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
