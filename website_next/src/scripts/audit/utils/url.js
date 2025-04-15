/**
 * Normalize a URL relative to a base
 */
export function normalizeUrl(href, base) {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

/**
 * Check if two URLs share the same domain
 */
export function isSameDomain(url, domain) {
  try {
    return new URL(url).hostname === domain;
  } catch {
    return false;
  }
}
