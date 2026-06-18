"use client";

import { useState, useEffect, useCallback } from "react";
import { useDndMonitor } from "@dnd-kit/core";

interface SnapLine {
  type: "horizontal" | "vertical";
  position: number;
  label?: string;
}

interface SectionRect {
  id: string;
  top: number;
  bottom: number;
  centerY: number;
  left: number;
  right: number;
  centerX: number;
}

const SNAP_THRESHOLD = 5;

export function SnapGuides({ sectionRects }: { sectionRects: SectionRect[] }) {
  const [activeLines, setActiveLines] = useState<SnapLine[]>([]);
  const [activeRect, setActiveRect] = useState<SectionRect | null>(null);

  useDndMonitor({
    onDragMove(event) {
      const { active, delta } = event;
      if (!active) return;

      const currentRect = sectionRects.find((r) => r.id === active.id);
      if (!currentRect) return;

      const movedRect: SectionRect = {
        ...currentRect,
        top: currentRect.top + delta.y,
        bottom: currentRect.bottom + delta.y,
        centerY: currentRect.centerY + delta.y,
      };

      setActiveRect(movedRect);

      const lines: SnapLine[] = [];

      for (const other of sectionRects) {
        if (other.id === currentRect.id) continue;

        // Snap to top alignment
        if (Math.abs(movedRect.top - other.top) < SNAP_THRESHOLD) {
          lines.push({ type: "horizontal", position: other.top, label: "Top" });
        }
        // Snap to bottom alignment
        if (Math.abs(movedRect.bottom - other.bottom) < SNAP_THRESHOLD) {
          lines.push({ type: "horizontal", position: other.bottom, label: "Bottom" });
        }
        // Snap to center alignment
        if (Math.abs(movedRect.centerY - other.centerY) < SNAP_THRESHOLD) {
          lines.push({ type: "horizontal", position: other.centerY, label: "Center" });
        }
      }

      setActiveLines(lines);
    },

    onDragEnd() {
      setActiveLines([]);
      setActiveRect(null);
    },

    onDragCancel() {
      setActiveLines([]);
      setActiveRect(null);
    },
  });

  if (activeLines.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-40">
      {activeLines.map((line, i) => (
        <div key={i}>
          {line.type === "horizontal" && (
            <div
              className="absolute left-0 right-0 h-px bg-blue-500"
              style={{ top: line.position }}
            >
              {line.label && (
                <span className="absolute right-2 -top-5 rounded bg-blue-500 px-1.5 py-0.5 text-[10px] text-white">
                  {line.label}
                </span>
              )}
            </div>
          )}
          {line.type === "vertical" && (
            <div
              className="absolute top-0 bottom-0 w-px bg-blue-500"
              style={{ left: line.position }}
            >
              {line.label && (
                <span className="absolute -left-8 top-2 rounded bg-blue-500 px-1.5 py-0.5 text-[10px] text-white">
                  {line.label}
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
