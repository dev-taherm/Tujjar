"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface SectionResizeHandleProps {
  sectionId: string;
  currentMinHeight?: string;
  onResize: (minHeight: string) => void;
}

export function SectionResizeHandle({ sectionId, currentMinHeight, onResize }: SectionResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const handleRef = useRef<HTMLDivElement>(null);

  const parseHeight = (value: string): number => {
    if (!value) return 0;
    const num = parseInt(value, 10);
    return isNaN(num) ? 0 : num;
  };

  const currentHeight = parseHeight(currentMinHeight || "");

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setStartY(e.clientY);
    setStartHeight(currentHeight);
  }, [currentHeight]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientY - startY;
      const newHeight = Math.max(50, startHeight + delta);
      onResize(`${newHeight}px`);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, startY, startHeight, onResize]);

  return (
    <div
      ref={handleRef}
      onMouseDown={handleMouseDown}
      className={`absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize group/resize ${
        isDragging ? "bg-blue-400" : "bg-transparent hover:bg-blue-200"
      }`}
      style={{ transform: "translateY(50%)" }}
    >
      <div className={`mx-auto h-0.5 w-8 rounded-full transition-colors ${
        isDragging ? "bg-blue-600" : "bg-gray-300 group-hover/resize:bg-blue-500"
      }`} />
    </div>
  );
}
