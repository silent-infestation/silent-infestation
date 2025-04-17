const axios = require("axios");
const FormData = require("form-data");
const cheerio = require("cheerio");

/**
 * Creates a malicious PHP file payload to test file upload vulnerabilities.
 * @returns {{ filename: string, content: Buffer }} The filename and content of the malicious file.
 */
export function createMaliciousFile() {
  const content = "<?php echo 'VULNERABLE AAAAA'; ?>";
  const filename = "malicious.php";
  return { filename, content: Buffer.from(content) };
}

/**
 * Attempts to extract a path to the uploaded file from an HTML response body.
 * @param {string} body - The HTML response body.
 * @param {string} filename - The name of the file to search for.
 * @returns {string|null} The discovered path to the file, or null if not found.
 */
export function extractMatchingFilePath(body, filename) {
  const $ = cheerio.load(body);
  let foundPath = null;

  const filepathRegex = new RegExp(`([\\w./-]*${filename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`);

  $("*").each((_, el) => {
    const text = $(el).text();
    if (text.includes(filename)) {
      const match = text.match(filepathRegex);
      if (match && match[1]) {
        foundPath = match[1];
        return false;
      }
    }
  });

  if (!foundPath) {
  }

  return foundPath;
}

/**
 * Constructs a FormData object from provided form definitions, inserting the malicious file.
 * @param {Object.<string, string>} formDataDef - A key/value object of input names and values.
 * @param {Object.<string, string>} formInputsDef - A key/type object of input names and their input types.
 * @param {{ filename: string, content: Buffer }} maliciousFile - The malicious file to attach to file inputs.
 * @returns {FormData} The constructed FormData instance.
 */
export function buildFormData(formDataDef, formInputsDef, maliciousFile) {
  const formData = new FormData();
  for (const [name, value] of Object.entries(formDataDef)) {
    const type = formInputsDef[name];
    if (type === "file") {
      formData.append(name, maliciousFile.content, maliciousFile.filename);
    } else {
      formData.append(name, value);
    }
  }
  return formData;
}

/**
 * Attempts to discover the URL of an uploaded file either via common paths or page crawling.
 * @param {string} baseUrl - The starting URL to crawl.
 * @param {string} filename - The name of the uploaded file to search for.
 * @returns {Promise<string|null>} A URL where the file was found, or null if not found.
 */
export async function findUploadedFile(baseUrl, filename) {
  const domain = new URL(baseUrl).hostname;
  const visited = new Set();
  const queue = [baseUrl];
  const commonUploadPaths = [
    "uploads/",
    "upload/",
    "files/",
    "user_uploads/",
    "documents/",
    "images/",
    "hackable/uploads/",
  ];

  for (const path of commonUploadPaths) {
    const testUrl = new URL(path + filename, baseUrl).href;
    try {
      const res = await axios.get(testUrl, { validateStatus: () => true });
      const body = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
      if (res.status === 200 && body.includes("VULNERABLE AAAAA")) {
        console.info(` [+] Uploaded file accessible at guessed location: ${testUrl}`);
        return testUrl;
      }
    } catch (e) {
      console.error(` [!] Error accessing guessed path ${testUrl}: ${e.message}`);
    }
  }

  while (queue.length > 0) {
    const url = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);
    try {
      const res = await axios.get(url, { validateStatus: () => true });
      const html = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
      if (html.includes(filename)) {
        console.info(` [+] Found reference to uploaded file (${filename}) on page: ${url}`);
        return url;
      }

      const $ = cheerio.load(html);
      $("a[href]").each((_, a) => {
        const href = $(a).attr("href");
        if (
          !href ||
          href.startsWith("#") ||
          href.startsWith("mailto:") ||
          href.startsWith("javascript:")
        )
          return;
        let newUrl;
        try {
          newUrl = new URL(href, url).href;
        } catch {
          return;
        }
        if (new URL(newUrl).hostname === domain && !visited.has(newUrl)) {
          queue.push(newUrl);
        }
      });
    } catch (err) {
      console.error(` [!] Failed to crawl ${url}: ${err.message}`);
    }
  }

  console.info(` [-] Uploaded file (${filename}) not found in crawl or common paths.`);
  return null;
}

/**
 * Tests a single structured form object for upload vulnerabilities.
 * @param {Object} form - The structured form object.
 * @param {string} pageUrl - The page URL where the form was found.
 * @param {Function} noteFinding - A callback to record findings in the report.
 * @returns {Promise<void>}
 */
export async function analyzeStructuredForm(form, pageUrl, noteFinding) {
  const { method, actionUrl, formData: formDataDef, formInputs: formInputsDef } = form;
  if (method.toUpperCase() !== "POST") return;

  const maliciousFile = createMaliciousFile();
  const formData = buildFormData(formDataDef, formInputsDef, maliciousFile);

  try {
    const response = await axios.post(actionUrl, formData, {
      headers: formData.getHeaders(),
      maxRedirects: 0,
      validateStatus: () => true,
    });

    const body = typeof response.data === "string" ? response.data : JSON.stringify(response.data);
    const redirectUrl = response.headers?.location
      ? new URL(response.headers.location, actionUrl).href
      : null;

    const tryURL = async (url) => {
      try {
        const res = await axios.get(url);
        const content = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
        const contentType = res.headers["content-type"] || "";
        if (content.includes("VULNERABLE AAAAA")) {
          return {
            url,
            detail: contentType.includes("text/html")
              ? "Malicious script executed and served as HTML"
              : `Malicious file served (content type: ${contentType})`,
          };
        }
      } catch (e) {
        console.warn(`[WARN] Failed to fetch file at ${url}: ${e.message}`);
      }
      return null;
    };

    let vulnInfo = null;
    const foundPath = extractMatchingFilePath(body, maliciousFile.filename);
    if (foundPath) {
      vulnInfo = await tryURL(new URL(foundPath, actionUrl).href);
    } else if (redirectUrl) {
      vulnInfo = await tryURL(redirectUrl);
    } else {
      const fileDiscoveryUrl = await findUploadedFile(pageUrl, maliciousFile.filename);
      if (fileDiscoveryUrl) {
        vulnInfo = {
          url: fileDiscoveryUrl,
          detail: "Uploaded file is publicly accessible on the site",
        };
      }
    }

    if (vulnInfo) {
      console.info(`[!!] Vulnerability detected: ${vulnInfo.detail} at ${vulnInfo.url}`);
      noteFinding("upload_form_vulnerability", pageUrl, vulnInfo.detail, {
        confidence: "medium",
        severity: "high",
      });
    } else {
    }
  } catch (err) {
    console.error(`[x] Error submitting form to ${actionUrl}: ${err.message}`);
  }
}

/**
 * Tests an array of structured forms for file upload vulnerabilities.
 * @param {Array<Object>} forms - The array of structured form definitions.
 * @param {string} pageUrl - The URL of the page where the forms were discovered.
 * @param {Function} noteFinding - A callback to record each finding.
 * @returns {Promise<void>}
 */
export async function testUploadForms(forms, pageUrl, noteFinding) {
  const uploadForms = forms.filter((form) => form.method.toUpperCase() === "POST");
  for (const form of uploadForms) {
    await analyzeStructuredForm(form, pageUrl, noteFinding);
  }
}
