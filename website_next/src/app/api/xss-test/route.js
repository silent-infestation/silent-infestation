// File: app/api/xss-test/route.js
import { NextResponse } from 'next/server';
import Crawler from 'crawler';
import * as cheerio from 'cheerio';
import https from 'https';
import axios from 'axios';

// Axios instance accepting self-signed certificates
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  timeout: 10000,
});

// XSS payloads to test
const xssPayloads = [
  '<script>alert("XSS")</script>',
  '<img src="x" onerror="alert(1)">',
  '<svg onload="alert(1)">',
  '<iframe src="javascript:alert(1)"></iframe>',
  '<a href="javascript:alert(1)">Click me</a>',
];

/**
 * Test a single page for XSS by injecting payloads into a `name` parameter.
 */
async function detectXSS(pageUrl) {
  const results = [];
  try {
    for (const payload of xssPayloads) {
      const separator = pageUrl.includes('?') ? '&' : '?';
      const urlWithPayload = `${pageUrl}${separator}name=${encodeURIComponent(payload)}`;
      console.info(`➡️ Testing XSS payload on: ${urlWithPayload}`);
      const { data: html } = await axiosInstance.get(urlWithPayload);
      if (html.includes(payload)) {
        results.push(urlWithPayload);
        console.warn(`🚨 XSS trouvé sur ${urlWithPayload}`);
      }
    }
    return results.length > 0
      ? { url: pageUrl, xssDetected: true, problematicUrls: results }
      : { url: pageUrl, xssDetected: false };
  } catch (err) {
    console.error(`❌ Error on ${pageUrl}: ${err.message}`);
    return { url: pageUrl, error: err.message, xssDetected: false };
  }
}

/**
 * Crawl a site starting from `startUrl` and run detectXSS on each internal page.
 */
function crawlAndDetectXSS(startUrl) {
  const visited = new Set();
  const queueSet = new Set();
  const findings = [];
  const mainDomain = new URL(startUrl).hostname;

  const crawler = new Crawler({
    maxConnections: 5,
    retries: 2,
    strictSSL: false,
    jQuery: false, // disable built-in jQuery, we'll use cheerio
    callback: async (error, res, done) => {
      if (error) {
        console.error(`Crawler error: ${error.message}`);
        done();
        return;
      }

      // Get actual URL
      const pageUrl = res.request?.uri?.href || res.options?.url;
      if (!pageUrl || visited.has(pageUrl)) {
        done();
        return;
      }
      console.info(`🔍 Crawling: ${pageUrl}`);
      visited.add(pageUrl);

      // Load HTML with cheerio
      const html = res.body;
      if (typeof html !== 'string') {
        done();
        return;
      }
      const $ = cheerio.load(html);

      // Detect XSS on this page
      const result = await detectXSS(pageUrl);
      if (result.xssDetected) findings.push(result);

      // Enqueue internal links
      $('a[href]').each((i, el) => {
        const href = $(el).attr('href');
        if (!href || href.startsWith('#') || href.startsWith('mailto:')) return;
        try {
          const absolute = new URL(href, pageUrl).href;
          const domain = new URL(absolute).hostname;
          if (domain === mainDomain && !visited.has(absolute) && !queueSet.has(absolute)) {
            queueSet.add(absolute);
            crawler.queue({ url: absolute });
          }
        } catch {
          // Skip invalid URLs
        }
      });

      done();
    },
  });

  return new Promise((resolve) => {
    queueSet.add(startUrl);
    crawler.queue({ url: startUrl });
    crawler.on('drain', () => resolve(findings));
  });
}

export async function POST(req) {
  try {
    const { startUrl } = await req.json();
    if (!startUrl) {
      return NextResponse.json({ error: 'startUrl is required' }, { status: 400 });
    }
    console.info(`🚀 Starting XSS crawl on: ${startUrl}`);
    const results = await crawlAndDetectXSS(startUrl);
    return NextResponse.json(results);
  } catch (err) {
    console.error(`Route error: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
