"use client";

import { useState, useEffect, useCallback } from "react";
import { Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, Link, Type } from "lucide-react";

interface FloatingToolbarProps {
  visible: boolean;
  position: { x: number; y: number };
  onFormat: (command: string, value?: string) => void;
}

export function FloatingToolbar({ visible, position, onFormat }: FloatingToolbarProps) {
  if (!visible) return null;

  const buttons = [
    { icon: Bold, command: "bold", title: "Bold" },
    { icon: Italic, command: "italic", title: "Italic" },
    { icon: UnderlineIcon, command: "underline", title: "Underline" },
    { type: "separator" as const },
    { icon: AlignLeft, command: "justifyLeft", title: "Align Left" },
    { icon: AlignCenter, command: "justifyCenter", title: "Align Center" },
    { icon: AlignRight, command: "justifyRight", title: "Align Right" },
    { type: "separator" as const },
    { icon: Link, command: "createLink", title: "Insert Link" },
  ];

  return (
    <div
      className="fixed z-[60] flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white px-1.5 py-1 shadow-xl"
      style={{ top: position.y - 48, left: position.x }}
    >
      {buttons.map((btn, i) => {
        if (btn.type === "separator") {
          return <div key={i} className="mx-0.5 h-5 w-px bg-gray-200" />;
        }
        const Icon = btn.icon;
        return (
          <button
            key={i}
            onClick={(e) => {
              e.preventDefault();
              if (btn.command === "createLink") {
                const url = prompt("Enter URL:");
                if (url) onFormat(btn.command, url);
              } else {
                onFormat(btn.command);
              }
            }}
            className="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            title={btn.title}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
