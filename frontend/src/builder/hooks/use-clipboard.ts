"use client";

import { useCallback, useMemo } from "react";
import type { Section } from "@/shared/types";

const STORAGE_KEY = "page-builder-clipboard";

interface ClipboardData {
  pageId: string;
  sections: Section[];
  copiedAt: string;
}

function readClipboard(): ClipboardData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ClipboardData;
  } catch {
    return null;
  }
}

export function useClipboard() {
  const clipboardData = useMemo(() => readClipboard(), []);

  const hasClipboard = clipboardData !== null;
  const clipboardPageId = clipboardData?.pageId ?? null;
  const clipboardSectionType = clipboardData?.sections?.[0]?.type ?? null;

  const copySection = useCallback((section: Section, pageId: string) => {
    const clone: Section = JSON.parse(JSON.stringify(section));
    const data: ClipboardData = {
      pageId,
      sections: [clone],
      copiedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  const pasteSection = useCallback((): Section | null => {
    const data = readClipboard();
    if (!data?.sections?.length) return null;

    const cloned = data.sections.map((s) => ({
      ...JSON.parse(JSON.stringify(s)) as Section,
      id: crypto.randomUUID(),
    }));

    return cloned[0];
  }, []);

  return {
    copySection,
    pasteSection,
    hasClipboard,
    clipboardPageId,
    clipboardSectionType,
  };
}
