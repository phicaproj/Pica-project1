const DEFAULT_AUTH_REDIRECT = "/dashboard";

export function safeNextPath(
  value: string | null | undefined,
  fallback = DEFAULT_AUTH_REDIRECT
): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  try {
    const url = new URL(value, "http://pica.local");
    if (url.origin !== "http://pica.local") return fallback;
    const normalized = `${url.pathname}${url.search}${url.hash}`;
    if (!normalized.startsWith("/") || normalized.startsWith("//")) {
      return fallback;
    }
    return normalized;
  } catch {
    return fallback;
  }
}

export function appendNext(path: string, next: string | null | undefined): string {
  const safeNext = safeNextPath(next);
  if (safeNext === DEFAULT_AUTH_REDIRECT) return path;
  return `${path}${path.includes("?") ? "&" : "?"}next=${encodeURIComponent(safeNext)}`;
}
