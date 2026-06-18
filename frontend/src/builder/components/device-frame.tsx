"use client";

import type { ReactNode } from "react";

interface DeviceFrameProps {
  device: "desktop" | "tablet" | "mobile";
  children: ReactNode;
}

export function DeviceFrame({ device, children }: DeviceFrameProps) {
  if (device === "desktop") {
    return <div className="w-full">{children}</div>;
  }

  if (device === "tablet") {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="w-[768px] rounded-xl border border-gray-300 bg-white shadow-lg overflow-hidden">
          <div className="h-2 bg-gray-200 rounded-b" />
          <div className="p-0">{children}</div>
        </div>
        <span className="text-xs font-medium text-gray-400">Tablet — 768px</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-[375px] rounded-3xl border-2 border-gray-300 bg-white shadow-lg overflow-hidden max-h-[600px] overflow-y-auto">
        <div className="flex items-center justify-center py-1.5 bg-gray-100">
          <div className="h-1 w-16 rounded-full bg-gray-300" />
        </div>
        <div className="p-0">{children}</div>
      </div>
      <span className="text-xs font-medium text-gray-400">Mobile — 375px</span>
    </div>
  );
}
