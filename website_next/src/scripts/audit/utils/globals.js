/**
 * Initializes and returns the global scan results map
 *
 * @returns {Map<string, object>} - Global scan results map (userId -> scan data)
 */
export function initializeGlobals() {
  const scanResultsMap = global.scanResultsMap || new Map();
  global.scanResultsMap = scanResultsMap;
  return scanResultsMap;
}

/**
 * Updates scan results for a given user
 *
 * @param {string} userId - The user identifier
 * @param {object} partialData - The latest partial scan data to store
 */
export function updatePartialData(userId, partialData) {
  global.scanResultsMap.set(userId, { ...partialData });
}

/**
 * Creates a new partial data structure for tracking audit progress
 *
 * @returns {{ crawledUrls: string[], securityFindings: object[], recommendationReport: object }}
 */
export function createPartialData() {
  return {
    crawledUrls: [],
    securityFindings: [],
    recommendationReport: {},
  };
}
