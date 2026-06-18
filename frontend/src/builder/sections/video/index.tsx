"use client";
import type { Section } from "@/shared/types";

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export function VideoPreview({ section }: { section: Section }) {
  const s = section.settings;
  const videoUrl = String(s.videoUrl || "");
  const title = String(s.title || "");
  const autoplay = Boolean(s.autoplay);
  const aspectRatio = String(s.aspectRatio || "16/9");

  const ratioClass: Record<string, string> = {
    "16/9": "aspect-video",
    "4/3": "aspect-[4/3]",
    "1/1": "aspect-square",
  };

  const youtubeId = extractYouTubeId(videoUrl);

  return (
    <div className="rounded-lg overflow-hidden" style={{ backgroundColor: "var(--color-surface)" }}>
      {title && <h2 className="mb-4 px-6 pt-6 text-2xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{title}</h2>}
      <div className={`${ratioClass[aspectRatio] || ratioClass["16/9"]} w-full`}>
        {youtubeId ? (
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${youtubeId}${autoplay ? "?autoplay=1" : ""}`}
            allow="autoplay; encrypted-media"
            allowFullScreen
            title={title || "Video"}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: "var(--color-border)" }}>
            <div className="text-center" style={{ color: "var(--color-text-secondary)" }}>
              <svg className="mx-auto mb-2 h-12 w-12 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              <p className="text-sm">Add a video URL to preview</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
