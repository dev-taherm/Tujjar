"use client";

interface SerpPreviewProps {
  title: string;
  description: string;
  url?: string;
}

export function SerpPreview({ title, description, url }: SerpPreviewProps) {
  const displayTitle = title || "Page Title";
  const displayDescription = description || "Add a meta description to see how this page will appear in search engine results.";
  const displayUrl = url || "yoursite.com/page";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500 mb-1">Search Engine Preview</p>
      <div className="space-y-1">
        <p className="text-[#1a0dab] text-lg leading-tight hover:underline cursor-pointer truncate">
          {displayTitle}
        </p>
        <p className="text-[#006621] text-sm truncate">{displayUrl}</p>
        <p className="text-[#545454] text-sm leading-relaxed line-clamp-2">
          {displayDescription}
        </p>
      </div>
      {title && title.length > 60 && (
        <p className="text-xs text-amber-600 mt-2">
          Title is {title.length} characters. Consider keeping it under 60 for optimal display.
        </p>
      )}
      {description && description.length > 160 && (
        <p className="text-xs text-amber-600 mt-1">
          Description is {description.length} characters. Consider keeping it under 160.
        </p>
      )}
    </div>
  );
}
