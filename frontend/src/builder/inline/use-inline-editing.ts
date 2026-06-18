"use client";

import { useState, useCallback, useEffect } from "react";

export function useInlineEditing() {
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [toolbarVisible, setToolbarVisible] = useState(false);

  useEffect(() => {
    if (!isInlineEditing) return;

    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount) {
        setToolbarVisible(false);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0) {
        setToolbarVisible(false);
        return;
      }

      setToolbarPosition({
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
      setToolbarVisible(true);
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [isInlineEditing]);

  const handleFormat = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
  }, []);

  const toggleInlineEditing = useCallback(() => {
    setIsInlineEditing((prev) => !prev);
    setToolbarVisible(false);
  }, []);

  return {
    isInlineEditing,
    toggleInlineEditing,
    toolbarVisible,
    toolbarPosition,
    handleFormat,
  };
}
