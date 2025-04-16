// Refactored Node.js script for crawling and testing file upload forms
//
// This script scans a website for file upload form vulnerabilities by crawling pages and
// attempting to upload a test PHP file to each file upload form found.
// It follows SOLID design principles, Clean Architecture separation of concerns,
// and functional programming best practices, as outlined in the requirements.

// Dependencies
const axios = require("axios");
const cheerio = require("cheerio");
const FormData = require("form-data");

// Configuration (can be easily adjusted or extended)
const MALICIOUS_FILENAME = "test.php"; // Name of the test file to upload
const MALICIOUS_FILE_CONTENT = "<?php echo 'VulnTest'; ?>"; // Content of the test PHP file
const MALICIOUS_FILE_TRIGGER_TEXT = "VulnTest"; // Text that the malicious file would output if executed
const DEFAULT_MAX_PAGES = 1000; // Safety limit to avoid infinite crawling (can be adjusted)

// Input Parser
// Parse command line arguments for target URL and optional max pages limit
function parseInput(argv) {
  if (argv.length < 3) {
    console.error("Usage: node scanner.js <start-url> [maxPages]");
    process.exit(1);
  }
  const startUrl = argv[2];
  const maxPages = argv[3] ? parseInt(argv[3], 10) : DEFAULT_MAX_PAGES;
  return { startUrl, maxPages };
}

// Core Logic: HTTP Page Fetcher
// Fetch the content of a URL (returns HTML as string). Uses dependency injection for HTTP client.
async function fetchPage(url, httpClient = axios) {
  try {
    const response = await httpClient.get(url);
    const html = response.data;
    return { url, html, status: response.status };
  } catch (error) {
    console.error(`Failed to fetch ${url}: ${error.message}`);
    return { url, html: null, status: null };
  }
}

// Core Logic: HTML Parsers

// Extract all same-domain links from a page's HTML to continue crawling
function extractLinks(html, baseUrl, baseDomain) {
  if (!html) return [];
  const $ = cheerio.load(html);
  const links = [];
  $("a[href]").each((_, elem) => {
    const href = $(elem).attr("href");
    if (!href) return;
    // Resolve relative URLs and filter to same domain
    let fullUrl;
    try {
      fullUrl = new URL(href, baseUrl);
    } catch {
      return; // skip invalid URLs
    }
    // Only consider http(s) links on the same domain
    if (!/^https?:/.test(fullUrl.protocol)) {
      return; // skip non-web protocols (mailto:, javascript:, etc.)
    }
    if (fullUrl.hostname !== baseDomain) {
      return; // skip external domains to stay within target site
    }
    // Normalize URL by removing fragment to avoid duplicates
    fullUrl.hash = "";
    const normalized = fullUrl.href;
    links.push(normalized);
  });
  return links;
}

// Extract all file upload forms (forms containing <input type="file">) from a page's HTML
function extractForms(html, baseUrl) {
  if (!html) return [];
  const $ = cheerio.load(html);
  const forms = [];
  $("form").each((_, formElem) => {
    const $form = $(formElem);
    // Only consider forms that have at least one file input field
    if ($form.find('input[type="file"]').length === 0) {
      return;
    }
    // Get form attributes
    let action = $form.attr("action") || "";
    const method = ($form.attr("method") || "GET").toUpperCase();
    // Resolve action URL relative to baseUrl; if empty, use the page's URL (self-post)
    if (!action || action.trim() === "") {
      action = baseUrl;
    } else {
      try {
        action = new URL(action, baseUrl).href;
      } catch {
        action = baseUrl;
      }
    }
    // Collect all input and textarea fields except file inputs and irrelevant types
    const fields = [];
    $form.find("input").each((_, inputElem) => {
      const $input = $(inputElem);
      const type = ($input.attr("type") || "text").toLowerCase();
      const name = $input.attr("name");
      if (!name) return; // skip inputs without a name attribute
      if (type === "file") {
        // Skip file inputs here; we'll handle them separately by adding our malicious file
        return;
      }
      if (type === "submit" || type === "button") {
        // Skip submit buttons – form submission will happen programmatically
        return;
      }
      // Determine value to submit for this field
      let value = $input.attr("value") || "";
      if (value === "") {
        // If no value attribute, provide a default dummy value based on type
        if (type === "text" || type === "password" || type === "search") {
          value = "test";
        } else if (type === "email") {
          value = "test@example.com";
        } else if (type === "number" || type === "range") {
          value = "0";
        } else if (type === "url") {
          value = baseUrl;
        } else if (type === "tel") {
          value = "1234567890";
        } else if (type === "checkbox" || type === "radio") {
          // For unchecked checkboxes/radios with no default, include only if required
          if ($input.attr("required")) {
            value = $input.attr("value") || "on";
          } else {
            return;
          }
        } else {
          value = "test";
        }
      }
      if (type === "checkbox" || type === "radio") {
        // Only include checkbox/radio if it’s checked or required (simulate a selected value)
        const isChecked = $input.attr("checked");
        const isRequired = $input.attr("required");
        if (!isChecked && !isRequired) {
          return;
        }
      }
      fields.push({ name, value });
    });
    // Include <textarea> fields as well, using their text content or a dummy value
    $form.find("textarea").each((_, txtElem) => {
      const $txt = $(txtElem);
      const name = $txt.attr("name");
      if (!name) return;
      let value = $txt.val() || $txt.text() || "";
      if (value === "") {
        value = "test";
      }
      fields.push({ name, value });
    });
    // Build the form descriptor object
    forms.push({ action, method, fields });
  });
  return forms;
}

// Core Logic: Form Submission and Vulnerability Check

// Attempt to submit a malicious PHP file through a given form and detect vulnerability
async function submitMaliciousFile(form, httpClient = axios) {
  const result = {
    action: form.action,
    method: form.method,
    vulnerable: false,
    uploadedFileUrl: null,
    message: "",
  };
  if (form.method !== "POST") {
    // File uploads should use POST; skip GET forms as they likely won't accept files
    result.message = "Form is not using POST method, skipping file upload attempt.";
    return result;
  }
  // Prepare multipart form data
  const formData = new FormData();
  // Append all other form fields with their values
  for (const field of form.fields) {
    formData.append(field.name, field.value);
  }
  // Append the malicious file content for the file input field(s)
  // (If multiple file inputs exist, we use the same payload for all for simplicity)
  formData.append("file", Buffer.from(MALICIOUS_FILE_CONTENT), MALICIOUS_FILENAME);
  // Submit the form via HTTP POST
  let response;
  try {
    response = await httpClient.post(form.action, formData, {
      headers: formData.getHeaders(),
      maxRedirects: 0, // do not follow redirects, we want to see the immediate response
    });
  } catch (err) {
    // Capture HTTP response even if status is an error (e.g., 4xx rejection)
    if (err.response) {
      response = err.response;
    } else {
      result.message = `Error submitting form: ${err.message}`;
      return result;
    }
  }
  const status = response.status;
  const body = typeof response.data === "string" ? response.data : "";
  // Analyze the response for signs of a successful upload
  if (status >= 200 && status < 300) {
    // If the response contains the uploaded filename or our trigger text, it's a strong indicator
    const filenameMentioned = body.includes(MALICIOUS_FILENAME);
    const triggerFound = body.includes(MALICIOUS_FILE_TRIGGER_TEXT);
    if (filenameMentioned || triggerFound) {
      result.vulnerable = true;
      result.message = "Server response contains uploaded file name or payload output.";
      // If we find the file name in the response, attempt to extract a URL to the file
      if (filenameMentioned) {
        const urlRegex = new RegExp(`https?://[^"'>]*${MALICIOUS_FILENAME}`);
        const match = body.match(urlRegex);
        if (match) {
          result.uploadedFileUrl = match[0];
        }
      }
    } else {
      // If no direct indication in response, attempt to guess a likely file location and verify
      try {
        const uploadUrl = new URL(form.action);
        const basePath = uploadUrl.href.substring(0, uploadUrl.href.lastIndexOf("/") + 1);
        const guessUrl = basePath + MALICIOUS_FILENAME;
        const verifyResp = await httpClient.get(guessUrl);
        const verifyBody = typeof verifyResp.data === "string" ? verifyResp.data : "";
        if (verifyResp.status < 400 && verifyBody.includes(MALICIOUS_FILE_TRIGGER_TEXT)) {
          result.vulnerable = true;
          result.message = "Malicious file was uploaded and is accessible at a guessed location.";
          result.uploadedFileUrl = guessUrl;
        }
      } catch {
        // Guessing file location failed or file not accessible
      }
    }
    if (!result.vulnerable) {
      // The file might have been accepted but we couldn’t verify by content
      result.message =
        "File upload form accepted the file (no error), but could not confirm accessibility.";
    }
  } else {
    // Non-2xx status codes imply the upload was likely rejected or failed
    if (body.match(/error|not allowed|invalid/i)) {
      result.message = "Upload rejected by server (error message detected).";
    } else {
      result.message = `Upload failed with HTTP status ${status}.`;
    }
  }
  return result;
}

// Core Logic: Page Processor

// Process a single page URL: fetch it, extract links and forms, handle file uploads on forms.
async function processPage(url, baseDomain, deps) {
  const { fetchPageFn, extractLinksFn, extractFormsFn, submitFormFn } = deps;
  // Fetch the page HTML
  const { html } = await fetchPageFn(url);
  // Parse out all file upload forms on the page
  const forms = extractFormsFn(html, url);
  const foundVulns = [];
  // Attempt to exploit each file upload form found
  for (const form of forms) {
    const result = await submitFormFn(form);
    if (result.vulnerable) {
      // Record details of the vulnerability
      if (result.uploadedFileUrl) {
        foundVulns.push(
          `File upload form **${form.action}** is VULNERABLE – uploaded file is accessible at ${result.uploadedFileUrl}`
        );
      } else {
        foundVulns.push(
          `File upload form **${form.action}** is POTENTIALLY VULNERABLE – file was accepted but not found at a guessed location`
        );
      }
    }
    // (If not vulnerable, we simply skip reporting it to avoid noise)
  }
  // Extract same-domain links to continue the crawl
  const links = extractLinksFn(html, url, baseDomain);
  return { links, foundVulns };
}

// Reporting: Output the collected results in a readable format
function reportResults(vulnerabilities) {
  console.log("---- Scan Complete ----");
  if (vulnerabilities.length === 0) {
    console.log("No file upload vulnerabilities found.");
  } else {
    console.log("Potential file upload vulnerabilities:");
    for (const vuln of vulnerabilities) {
      console.log(" - " + vuln);
    }
  }
}

// Main Execution: Orchestrate the crawling and scanning process
(async function main() {
  const { startUrl, maxPages } = parseInput(process.argv);
  const baseDomain = new URL(startUrl).hostname;
  const toCrawl = [startUrl];
  const visited = new Set();
  const vulnerabilities = [];
  // Prepare dependencies for processPage (allows easy injection of different implementations if needed)
  const deps = {
    fetchPageFn: fetchPage,
    extractLinksFn: extractLinks,
    extractFormsFn: extractForms,
    submitFormFn: submitMaliciousFile,
  };
  console.log(`Starting scan on ${startUrl} ...`);
  // BFS crawl loop up to maxPages
  while (toCrawl.length > 0 && visited.size < maxPages) {
    const url = toCrawl.shift();
    if (visited.has(url)) continue;
    visited.add(url);
    console.log(`[*] Crawling: ${url}`);
    const { links, foundVulns } = await processPage(url, baseDomain, deps);
    // Enqueue new links for crawling
    for (const link of links) {
      if (!visited.has(link)) {
        toCrawl.push(link);
      }
    }
    // Collect any vulnerabilities found on this page
    vulnerabilities.push(...foundVulns);
  }
  // Output the results
  reportResults(vulnerabilities);
})().catch((err) => {
  console.error("Error during scanning:", err);
});
