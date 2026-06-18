"use client";

import { useEffect } from "react";

interface ShortcutHandlers {
  undo?: () => void;
  redo?: () => void;
  save?: () => void;
  copy?: () => void;
  paste?: () => void;
  duplicate?: () => void;
  delete?: () => void;
  escape?: () => void;
  moveUp?: () => void;
  moveDown?: () => void;
  moveSectionUp?: () => void;
  moveSectionDown?: () => void;
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || (el as HTMLElement).isContentEditable;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;

      // Ctrl+Z → undo
      if (mod && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        handlers.undo?.();
        return;
      }

      // Ctrl+Shift+Z → redo
      if (mod && e.shiftKey && e.key === "z") {
        e.preventDefault();
        handlers.redo?.();
        return;
      }

      // Ctrl+S → save
      if (mod && e.key === "s") {
        e.preventDefault();
        handlers.save?.();
        return;
      }

      // Ctrl+C → copy
      if (mod && e.key === "c") {
        e.preventDefault();
        handlers.copy?.();
        return;
      }

      // Ctrl+V → paste
      if (mod && e.key === "v") {
        e.preventDefault();
        handlers.paste?.();
        return;
      }

      // Ctrl+D → duplicate
      if (mod && e.key === "d") {
        e.preventDefault();
        handlers.duplicate?.();
        return;
      }

      // Delete / Backspace → delete (not in input)
      if ((e.key === "Delete" || e.key === "Backspace") && !isInputFocused()) {
        e.preventDefault();
        handlers.delete?.();
        return;
      }

      // Escape
      if (e.key === "Escape") {
        e.preventDefault();
        handlers.escape?.();
        return;
      }

      // ArrowUp (not in input)
      if (e.key === "ArrowUp" && !mod && !isInputFocused()) {
        e.preventDefault();
        handlers.moveUp?.();
        return;
      }

      // ArrowDown (not in input)
      if (e.key === "ArrowDown" && !mod && !isInputFocused()) {
        e.preventDefault();
        handlers.moveDown?.();
        return;
      }

      // Ctrl+ArrowUp
      if (mod && e.key === "ArrowUp") {
        e.preventDefault();
        handlers.moveSectionUp?.();
        return;
      }

      // Ctrl+ArrowDown
      if (mod && e.key === "ArrowDown") {
        e.preventDefault();
        handlers.moveSectionDown?.();
        return;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlers]);
}
