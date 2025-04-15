/**
 * Initializes and returns the global scan results map
 */
export function initializeGlobals() {
  const scanResultsMap = global.scanResultsMap || new Map();
  global.scanResultsMap = scanResultsMap;
  return scanResultsMap;
}

/**
 * Updates scan results for a given user
 */
export function updatePartialData(userId, partialData) {
  global.scanResultsMap.set(userId, { ...partialData });
}

/**
 * Creates a new partial data structure for tracking audit progress
 */
export function createPartialData() {
  return {
    crawledUrls: [],
    securityFindings: [],
    recommendationReport: {},
  };
}
