"use client";
import type { Section } from "@/shared/types";
import { useState } from "react";

export function FaqPreview({ section }: { section: Section }) {
  const title = String(section.settings.title || "");
  const faqs = (section.settings.items as Array<{ question: string; answer: string }>) || [];
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <div className="py-8">
      {title && <h2 className="mb-6 text-2xl font-bold">{title}</h2>}
      <div className="space-y-3 max-w-2xl">
        {faqs.map((faq, i) => (
          <div key={i} className="rounded-lg border" style={{ borderColor: "var(--color-border)" }}>
            <button className="flex w-full items-center justify-between px-4 py-3 text-start font-medium" onClick={() => setOpenIndex(openIndex === i ? null : i)}>
              {faq.question}
              <span style={{ color: "var(--color-text-secondary)" }}>{openIndex === i ? "\u2212" : "+"}</span>
            </button>
            {openIndex === i && <div className="border-t px-4 py-3" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>{faq.answer}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
