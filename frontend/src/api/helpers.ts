export function unwrapResults<T>(data: T | { results?: T }): T {
  if (data && typeof data === "object" && "results" in data && data.results !== undefined) {
    return data.results as T;
  }
  return data as T;
}

export function buildSearchParams(params: Record<string, string | undefined | null>): URLSearchParams {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") {
      searchParams.set(key, value);
    }
  }
  return searchParams;
}
