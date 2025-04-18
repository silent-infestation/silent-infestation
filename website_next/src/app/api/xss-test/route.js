import * as cheerio from 'cheerio';
import axios from 'axios';
import Crawler from 'crawler';

const xssInjectionPayloads = [
  '<script>alert("XSS")</script>',
  '<img src="x" onerror="alert(1)">',
  '<svg onload="alert(1)">',
  '<iframe src="javascript:alert(1)"></iframe>',
  '<a href="javascript:alert(1)">Click me</a>',
];

// Fonction pour détecter les failles XSS
async function detectXSS(url) {
  try {
    console.info(`Testing XSS on ${url}`);
    const problematicUrls = [];

    for (const payload of xssInjectionPayloads) {
      const testUrl = `${url}?name=${encodeURIComponent(payload)}`;
      console.info(`Testing URL: ${testUrl}`);

      const response = await axios.get(testUrl);
      const $ = cheerio.load(response.data);

      // Vérifier si le payload est présent dans la réponse HTML
      if ($.html().includes(payload)) {
        problematicUrls.push(testUrl);
      }
    }

    return problematicUrls.length > 0
      ? { url, xssDetected: true, problematicUrls }
      : { url, xssDetected: false };
  } catch (error) {
    console.error(`Error testing XSS on ${url}: ${error.message}`);
    return { url, error: error.message };
  }
}

// Fonction pour crawler le site et détecter les failles XSS
async function crawlAndDetectXSS(startUrl) {
  const visitedUrls = new Set();
  const xssResults = [];
  const mainDomain = new URL(startUrl).hostname;

  const crawler = new Crawler({
    maxConnections: 10,
    retries: 3,
    callback: async (error, res, done) => {
      if (error) {
        console.error(`Error crawling ${res.options.uri}: ${error.message}`);
      } else {
        const $ = res.$;
        const pageUrl = res.options.uri;
        if ($ && pageUrl) {
          console.info(`Crawling page: ${pageUrl}`);

          visitedUrls.add(pageUrl);

          // Test la page actuelle pour les failles XSS
          const xssResult = await detectXSS(pageUrl);
          if (xssResult.xssDetected) {
            xssResults.push(xssResult);
          }

          // Extraire les liens internes
          $('a[href]').each((_, element) => {
            const href = $(element).attr('href');
            if (href) {
              const absoluteUrl = new URL(href, startUrl).href;
              if (
                absoluteUrl.startsWith(`http://${mainDomain}`) ||
                absoluteUrl.startsWith(`https://${mainDomain}`)
              ) {
                if (!visitedUrls.has(absoluteUrl)) {
                  visitedUrls.add(absoluteUrl);
                  crawler.queue(absoluteUrl);
                }
              }
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
      console.info('Crawling finished.');
      resolve(xssResults);
    });
  });
}

export async function POST(req) {
  const { startUrl } = await req.json();

  if (!startUrl) {
    return new Response(JSON.stringify({ error: 'startUrl is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  console.info(`Starting XSS detection on ${startUrl}`);
  const result = await crawlAndDetectXSS(startUrl);

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
