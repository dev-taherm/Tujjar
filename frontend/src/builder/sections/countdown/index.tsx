"use client";
import { useState, useEffect } from "react";
import type { Section } from "@/shared/types";

export function CountdownPreview({ section }: { section: Section }) {
  const s = section.settings;
  const title = String(s.title || "");
  const targetDate = String(s.targetDate || "");
  const showDays = s.showDays !== false;
  const showHours = s.showHours !== false;
  const showMinutes = s.showMinutes !== false;
  const showSeconds = s.showSeconds !== false;

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate).getTime();
    if (isNaN(target)) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const pad = (n: number) => String(n).padStart(2, "0");

  const boxes: Array<{ label: string; value: string; show: boolean }> = [
    { label: "Days", value: pad(timeLeft.days), show: showDays },
    { label: "Hours", value: pad(timeLeft.hours), show: showHours },
    { label: "Minutes", value: pad(timeLeft.minutes), show: showMinutes },
    { label: "Seconds", value: pad(timeLeft.seconds), show: showSeconds },
  ].filter((b) => b.show);

  return (
    <div className="rounded-lg py-10 px-6 text-center" style={{ backgroundColor: "var(--color-surface)" }}>
      {title && <h2 className="mb-6 text-2xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{title}</h2>}
      <div className="flex items-center justify-center gap-3">
        {boxes.map((b) => (
          <div key={b.label} className="flex flex-col items-center rounded-lg px-5 py-4" style={{ backgroundColor: "var(--color-primary)", minWidth: "80px" }}>
            <span className="text-3xl font-bold text-white">{b.value}</span>
            <span className="mt-1 text-xs uppercase text-white opacity-80">{b.label}</span>
          </div>
        ))}
      </div>
      {!targetDate && (
        <p className="mt-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>Set a target date to start the countdown</p>
      )}
    </div>
  );
}
