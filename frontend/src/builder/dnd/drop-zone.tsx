"use client";

import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";

interface DropZoneProps {
  id: string;
  onAddSection?: () => void;
  isOver?: boolean;
}

export function DropZone({ id, onAddSection, isOver: externalOver }: DropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({ id });

  const active = isOver || externalOver;

  return (
    <div
      ref={setNodeRef}
      className={`group relative flex items-center justify-center transition-all duration-200 ${
        active ? "h-16 bg-blue-50" : "h-2 hover:h-8 hover:bg-gray-50"
      }`}
    >
      {active && (
        <button
          onClick={onAddSection}
          className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm text-white shadow-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Section
        </button>
      )}
      <div
        className={`absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed transition-colors ${
          active ? "border-blue-400" : "border-transparent group-hover:border-gray-300"
        }`}
      />
    </div>
  );
}
