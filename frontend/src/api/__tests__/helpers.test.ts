import { describe, it, expect } from "vitest";
import { unwrapResults, buildSearchParams } from "../helpers";

describe("unwrapResults", () => {
  it("returns data directly when no results property", () => {
    const data = { name: "test" };
    expect(unwrapResults(data)).toBe(data);
  });

  it("unwraps results from paginated response", () => {
    const data = { results: [1, 2, 3], count: 3 };
    expect(unwrapResults(data)).toEqual([1, 2, 3]);
  });

  it("returns data when results is undefined", () => {
    const data = { results: undefined, count: 0 };
    expect(unwrapResults(data)).toBe(data);
  });

  it("returns null when results is null", () => {
    const data = { results: null };
    expect(unwrapResults(data)).toBeNull();
  });

  it("handles array data without results wrapper", () => {
    const data = [1, 2, 3];
    expect(unwrapResults(data)).toEqual([1, 2, 3]);
  });

  it("handles empty results array", () => {
    const data = { results: [] };
    expect(unwrapResults(data)).toEqual([]);
  });
});

describe("buildSearchParams", () => {
  it("builds search params from valid entries", () => {
    const params = { q: "shoes", page: "2" };
    const result = buildSearchParams(params);
    expect(result.get("q")).toBe("shoes");
    expect(result.get("page")).toBe("2");
  });

  it("skips undefined values", () => {
    const params = { q: "shoes", page: undefined };
    const result = buildSearchParams(params);
    expect(result.has("page")).toBe(false);
  });

  it("skips null values", () => {
    const params = { q: "shoes", sort: null };
    const result = buildSearchParams(params);
    expect(result.has("sort")).toBe(false);
  });

  it("skips empty string values", () => {
    const params = { q: "shoes", category: "" };
    const result = buildSearchParams(params);
    expect(result.has("category")).toBe(false);
  });

  it("returns empty params for empty input", () => {
    const result = buildSearchParams({});
    expect(result.toString()).toBe("");
  });
});
