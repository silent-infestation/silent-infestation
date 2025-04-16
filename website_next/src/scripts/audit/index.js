import Crawler from "crawler";
import { URL } from "url";

import { initializeGlobals, updatePartialData, createPartialData } from "./utils/globals";
import { normalizeUrl, isSameDomain } from "./utils/url";
import {
  noteFindingFactory,
  findingToRecommendation,
  securityResources,
  generateSummaryReport,
} from "./utils/findings";
import { checkHTTPS, checkCredentialsInUrl, checkForPasswordReset } from "./modules/authChecks";
import { processForms } from "./modules/formChecks";

const scanResultsMap = initializeGlobals();

/**
 * Main exported audit runner function
 *
 * @param {string} startUrl - Initial page to begin crawling from
 * @param {string} userId - Unique user identifier for tracking scan results
 * @returns {Promise<object>} final scan results including findings and recommendations
 */
export async function runAudit(startUrl, userId) {
  const partialData = createPartialData();
  const visitedUrls = new Map();
  const recordedFindings = new Set();

  const noteFinding = noteFindingFactory(recordedFindings, userId, partialData);
  scanResultsMap.set(userId, partialData);

  try {
    const crawledUrls = await startCrawler(startUrl, visitedUrls, userId, partialData, noteFinding);

    for (const url of crawledUrls) {
      const $ = visitedUrls.get(url);
      if (!$) continue;
      await processForms($, url, noteFinding);
    }

    partialData.recommendationReport = generateSummaryReport(
      partialData.securityFindings,
      findingToRecommendation,
      securityResources
    );

    return partialData;
  } catch (err) {
    console.error("[runAudit] Unexpected error:", err);
    throw err;
  }
}

/**
 * Starts the crawler using the initial URL.
 * Tracks and stores visited URLs and discovered links.
 *
 * @param {string} startUrl - The starting URL for crawling
 * @returns {Promise<string[]>} - Array of successfully crawled URLs
 */
async function startCrawler(
  startUrl,
  visitedUrls = new Map(),
  userId,
  partialData,
  noteFinding = () => {}
) {
  return new Promise((resolve) => {
    const foundUrls = new Set();
    const domain = new URL(startUrl).hostname;

    const crawler = new Crawler({
      maxConnections: 10,
      retries: 3,
      callback: async (err, res, done) => {
        const pageUrl = res.options?.url;

        if (!err && res.$ && pageUrl && !visitedUrls.has(pageUrl)) {
          visitedUrls.set(pageUrl, res.$);
          foundUrls.add(pageUrl);
          partialData.crawledUrls.push(pageUrl);
          updatePartialData(userId, partialData);

          await checkHTTPS(pageUrl, noteFinding);
          checkForPasswordReset(pageUrl, noteFinding);
          checkCredentialsInUrl(pageUrl, noteFinding);

          for (const link of extractLinks(res.$, domain, pageUrl)) {
            if (!visitedUrls.has(link)) crawler.queue(link);
          }
        } else if (err) {
          console.error(`[Crawler Error] ${pageUrl}: ${err.message}`);
        }
        done();
      },
    });

    crawler.queue(startUrl);
    crawler.on("drain", () => resolve([...foundUrls]));
  });
}

/**
 * Extracts valid crawlable links from anchor tags on the page.
 *
 * @param {cheerio.Root} $ - The cheerio DOM object for the page
 * @param {string} domain - The root domain for comparison
 * @param {string} baseUrl - Base URL for resolving relative paths
 * @returns {string[]} - List of valid URLs to crawl
 */
function extractLinks($, domain, baseUrl) {
  const links = new Set();
  $("a").each((_, el) => {
    const href = $(el).attr("href");
    const fullUrl = normalizeUrl(href, baseUrl);
    if (fullUrl && isSameDomain(fullUrl, domain) && !fullUrl.match(/\.(jpg|png|svg|yml|yaml)$/i)) {
      links.add(fullUrl);
    }
  });
  return [...links];
}
