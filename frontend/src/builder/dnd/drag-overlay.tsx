"use client";

import { getRegistryEntry } from "@/builder/sections/registry";
import * as Icons from "lucide-react";

interface DragOverlayProps {
  type: string;
}

export function DragOverlay({ type }: DragOverlayProps) {
  const def = getRegistryEntry(type);
  if (!def) return null;

  const IconComponent = (Icons as any)[def.icon] || Icons.Box;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-blue-300 bg-white px-4 py-3 shadow-2xl ring-2 ring-blue-100">
      <IconComponent className="h-5 w-5 text-blue-600" />
      <span className="text-sm font-medium text-gray-900">{def.label}</span>
    </div>
  );
}
