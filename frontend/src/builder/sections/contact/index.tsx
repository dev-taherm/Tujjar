"use client";
import type { Section } from "@/shared/types";

export function ContactPreview({ section }: { section: Section }) {
  const s = section.settings;
  const title = String(s.title || "Contact Us");
  const subtitle = String(s.subtitle || "");
  const email = String(s.email || "");
  const phone = String(s.phone || "");
  const address = String(s.address || "");
  const showForm = s.showForm !== false;

  return (
    <div className="rounded-lg py-10 px-6" style={{ backgroundColor: "var(--color-surface)" }}>
      {title && <h2 className="mb-2 text-center text-2xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{title}</h2>}
      {subtitle && <p className="mb-8 text-center" style={{ color: "var(--color-text-secondary)" }}>{subtitle}</p>}
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          {email && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--color-primary)" }}>
                <span className="text-white text-sm">&#9993;</span>
              </div>
              <div>
                <p className="text-xs uppercase" style={{ color: "var(--color-text-secondary)" }}>Email</p>
                <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{email}</p>
              </div>
            </div>
          )}
          {phone && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--color-primary)" }}>
                <span className="text-white text-sm">&#9742;</span>
              </div>
              <div>
                <p className="text-xs uppercase" style={{ color: "var(--color-text-secondary)" }}>Phone</p>
                <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{phone}</p>
              </div>
            </div>
          )}
          {address && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--color-primary)" }}>
                <span className="text-white text-sm">&#9873;</span>
              </div>
              <div>
                <p className="text-xs uppercase" style={{ color: "var(--color-text-secondary)" }}>Address</p>
                <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{address}</p>
              </div>
            </div>
          )}
        </div>
        {showForm && (
          <div className="space-y-4">
            <input type="text" placeholder="Your Name" className="w-full rounded-lg border px-4 py-3 text-sm" style={{ borderColor: "var(--color-border)" }} />
            <input type="email" placeholder="Your Email" className="w-full rounded-lg border px-4 py-3 text-sm" style={{ borderColor: "var(--color-border)" }} />
            <textarea placeholder="Your Message" rows={4} className="w-full resize-none rounded-lg border px-4 py-3 text-sm" style={{ borderColor: "var(--color-border)" }} />
            <button className="rounded-lg px-6 py-3 text-sm font-medium text-white" style={{ backgroundColor: "var(--color-primary)" }}>Send Message</button>
          </div>
        )}
      </div>
    </div>
  );
}
