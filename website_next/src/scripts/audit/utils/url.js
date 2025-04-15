/**
 * Normalize a URL relative to a base
 *
 * @param {string} href - Relative or absolute href string
 * @param {string} base - Base URL for resolution
 * @returns {string|null} - Fully resolved absolute URL or null if invalid
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
 *
 * @param {string} url - The full URL to compare
 * @param {string} domain - The domain to compare against
 * @returns {boolean} - True if domain matches, false otherwise
 */
export function isSameDomain(url, domain) {
  try {
    return new URL(url).hostname === domain;
  } catch {
    return false;
  }
}
