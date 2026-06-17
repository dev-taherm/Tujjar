import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cn, formatCurrency, formatDate, formatDateTime, slugify, truncate, getInitials } from "../utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("resolves tailwind conflicts", () => {
    expect(cn("px-4 px-6")).toBe("px-6");
  });

  it("handles undefined and null", () => {
    expect(cn("foo", undefined, null)).toBe("foo");
  });
});

describe("formatCurrency", () => {
  it("formats USD by default", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
  });

  it("formats with custom currency", () => {
    expect(formatCurrency(1234.56, "EUR")).toBe("€1,234.56");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats negative amounts", () => {
    expect(formatCurrency(-99.99)).toBe("-$99.99");
  });
});

describe("formatDate", () => {
  it("formats a date string", () => {
    const result = formatDate("2025-06-15");
    expect(result).toBe("Jun 15, 2025");
  });

  it("formats a Date object", () => {
    const result = formatDate(new Date("2025-01-01T00:00:00Z"));
    expect(result).toBe("Jan 1, 2025");
  });
});

describe("formatDateTime", () => {
  it("formats a datetime string", () => {
    const result = formatDateTime("2025-06-15T14:30:00Z");
    expect(result).toMatch(/Jun 15, 2025/);
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});

describe("slugify", () => {
  it("converts text to slug", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(slugify("Hello! @World#")).toBe("hello-world");
  });

  it("handles multiple spaces and underscores", () => {
    expect(slugify("hello   world__foo")).toBe("hello-world-foo");
  });

  it("trims leading and trailing dashes", () => {
    expect(slugify("--hello--")).toBe("hello");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });
});

describe("truncate", () => {
  it("returns text when under length", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("returns text when equal to length", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });

  it("truncates text exceeding length", () => {
    expect(truncate("hello world", 5)).toBe("hello...");
  });
});

describe("getInitials", () => {
  it("returns two initials from full name", () => {
    expect(getInitials("John Doe")).toBe("JD");
  });

  it("returns single initial from single name", () => {
    expect(getInitials("John")).toBe("J");
  });

  it("returns only first two initials from multi-word name", () => {
    expect(getInitials("John Michael Doe")).toBe("JM");
  });

  it("returns uppercase initials", () => {
    expect(getInitials("jane smith")).toBe("JS");
  });
});
