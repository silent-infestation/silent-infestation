import Crawler from "crawler";
import { URL } from "url";
import { PrismaClient } from "@prisma/client";

import { normalizeUrl, isSameDomain } from "./utils/url";
import { noteFindingFactory } from "./utils/findings";
import { checkHTTPS, checkCredentialsInUrl, checkForPasswordReset } from "./modules/authChecks";
import { processForms } from "./modules/formChecks";

const prisma = new PrismaClient();

/**
 * Main exported audit runner function
 *
 * @param {string} startUrl - Initial page to begin crawling from
 * @param {string} userId - Unique user identifier for tracking scan results
 * @returns {Promise<void>} Final result stored in DB
 */
export async function runAudit(startUrl, userId) {
  const visitedUrls = new Map();
  const recordedFindings = new Set();

  // Get the latest running Scan
  const scan = await prisma.scan.findFirst({
    where: { userId },
    orderBy: { scannedAt: "desc" },
  });

  if (!scan) {
    throw new Error("No scan record found for user.");
  }

  // Create initial ScanResult entry
  const scanResult = await prisma.scanResult.create({
    data: {
      scanId: scan.id,
      totalFindings: 0,
    },
  });

  const scanResultId = scanResult.id;
  const noteFinding = noteFindingFactory(recordedFindings, scanResultId);

  try {
    const crawledUrls = await startCrawler(startUrl, visitedUrls, noteFinding);

    // Store crawled URLs in the database
    await prisma.crawledUrl.createMany({
      data: crawledUrls.map((url) => ({
        scanResultId,
        url,
      })),
      skipDuplicates: true,
    });

    for (const url of crawledUrls) {
      const $ = visitedUrls.get(url);
      if (!$) continue;
      await processForms($, url, noteFinding);
    }

    // Update findings count
    await prisma.scanResult.update({
      where: { id: scanResultId },
      data: { totalFindings: recordedFindings.size },
    });

    await prisma.scan.update({
      where: { id: scan.id },
      data: {
        isRunning: false,
        status: "success",
      },
    });
  } catch (err) {
    console.error("[runAudit] Unexpected error:", err);

    await prisma.scan.update({
      where: { id: scan.id },
      data: {
        isRunning: false,
        status: "error",
      },
    });

    throw err;
  }
}

/**
 * Starts the crawler using the initial URL.
 * Tracks and stores visited URLs and discovered links.
 *
 * @param {string} startUrl - The starting URL for crawling
 * @param {Map<string, cheerio.Root>} visitedUrls - Cache of visited pages
 * @param {Function} noteFinding - Finding logger function
 * @returns {Promise<string[]>} - Array of successfully crawled URLs
 */
async function startCrawler(startUrl, visitedUrls = new Map(), noteFinding = () => {}) {
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
