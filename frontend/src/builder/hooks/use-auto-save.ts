"use client";

import { useEffect, useRef, useCallback, useState } from "react";

export function useAutoSave(
  saveFn: () => Promise<void>,
  isDirty: boolean,
  delay = 5000,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const save = useCallback(async () => {
    if (isAutoSaving) return;
    setIsAutoSaving(true);
    try {
      await saveFn();
      setLastSavedAt(new Date());
    } finally {
      setIsAutoSaving(false);
    }
  }, [saveFn, isAutoSaving]);

  useEffect(() => {
    if (!isDirty) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setTimeout(() => {
      save();
      timerRef.current = null;
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isDirty, delay, save]);

  // Save immediately on unmount if dirty
  useEffect(() => {
    return () => {
      if (isDirty && timerRef.current) {
        clearTimeout(timerRef.current);
        save();
      }
    };
  }, [isDirty, save]);

  return { isAutoSaving, lastSavedAt };
}
