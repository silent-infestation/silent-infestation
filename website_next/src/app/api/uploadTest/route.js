/**
 * uploadTest.js - Script Node.js pour crawler un site et tester les formulaires d'upload de fichiers.
 */
 const axios = require("axios");
 const cheerio = require("cheerio");
 let Crawler;
 try {
   Crawler = require("crawler").Crawler;
 } catch (e) {
   Crawler = null;
 }
 
 const FormData = require("form-data");
 const path = require("path");
 
 function createMaliciousFile() {
   const content = "<?php echo 'VULNERABLE AAAAA'; ?>";
   const filename = "malicious.php";
   return { filename, content: Buffer.from(content) };
 }
 
 async function findUploadedFile(baseUrl, filename) {
   const domain = new URL(baseUrl).hostname;
   const visited = new Set();
   const queue = [baseUrl];
 
   // Common upload paths to brute force
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
 
 function isLikelyFilePath(str) {
   const unixPathPattern = /(?:\/[^\s]+)+/g;
   const windowsPathPattern = /(?:[a-zA-Z]:\\[^\s]+)+/g;
   return unixPathPattern.test(str) || windowsPathPattern.test(str);
 }
 
 async function analyzeUploadForm(formHtml, pageUrl, vulnerableForms) {
   const $form = cheerio.load(formHtml);
   const form = $form("form");
   let action = form.attr("action") || "";
   const method = (form.attr("method") || "GET").toUpperCase();
   if (method !== "POST") {
     console.info(`Skipping form (method ${method}) on ${pageUrl} - not a POST form.`);
     return;
   }
   let formActionUrl;
   try {
     formActionUrl = new URL(action || pageUrl, pageUrl).href;
   } catch (err) {
     console.error(
       `Failed to resolve form action URL: ${action} on page ${pageUrl} - ${err.message}`
     );
     return;
   }
   console.info(`[*] Testing file upload form on page ${pageUrl} (action: ${formActionUrl})`);
   const formData = new FormData();
   const inputFields = form.find("input, textarea, select");
   const handledFields = new Set();
 
   inputFields.each((i, elem) => {
     const tag = elem.tagName.toLowerCase();
     const $elem = $form(elem);
     const name = $elem.attr("name");
     if (!name || handledFields.has(name) || $elem.attr("disabled")) return;
     const type = tag === "input" ? ($elem.attr("type") || "text").toLowerCase() : tag;
     if (type === "file") return;
     let value = $elem.val() || "";
     if (type === "radio") {
       const radios = form.find(`input[name='${name}'][type='radio']`);
       const chosen = radios.filter((_, el) => $form(el).attr("checked")).first() || radios.first();
       formData.append(name, chosen.val() || "on");
     } else if (type === "checkbox") {
       const checkboxes = form.find(`input[name='${name}'][type='checkbox']`);
       let anyChecked = false;
       checkboxes.each((_, cb) => {
         const $cb = $form(cb);
         if ($cb.attr("checked")) {
           formData.append(name, $cb.val() || "on");
           anyChecked = true;
         }
       });
       if (!anyChecked && checkboxes.length > 0)
         formData.append(name, $form(checkboxes[0]).val() || "on");
     } else if (tag === "select") {
       const options = $elem.find("option");
       const selectedVal =
         options.filter((_, opt) => $form(opt).attr("selected")).first() || options.first();
       formData.append(name, selectedVal.attr("value") || selectedVal.text());
     } else {
       if (!value) {
         value =
           type === "email"
             ? "test@example.com"
             : type === "number"
               ? "1"
               : type === "tel"
                 ? "1234567890"
                 : type === "url"
                   ? "http://example.com"
                   : type === "date"
                     ? "2025-01-01"
                     : "test";
       }
       formData.append(name, value);
     }
     handledFields.add(name);
   });
 
   const maliciousFile = createMaliciousFile();
   form.find('input[type="file"]').each((i, fileInput) => {
     const $fileInput = $form(fileInput);
     const name = $fileInput.attr("name") || `file_${i}`;
     formData.append(name, maliciousFile.content, maliciousFile.filename);
     console.info(` -> Attached malicious file as "${name}" (${maliciousFile.filename})`);
   });
 
   let response;
   try {
     response = await axios.post(formActionUrl, formData, {
       headers: formData.getHeaders(),
       maxRedirects: 0,
       validateStatus: () => true,
     });
   } catch (err) {
     console.error(`Error submitting form at ${formActionUrl}: ${err.message}`);
     return;
   }
   const status = response.status;
   console.info(` <- Received HTTP ${status} from ${formActionUrl}`);
   const bodyStr = typeof response.data === "string" ? response.data : JSON.stringify(response.data);
   let redirectedUrl = response.headers?.location
     ? new URL(response.headers.location, formActionUrl).href
     : null;
 
   let payloadFound = false;
   let vulnDescription = "";
   let payloadUrl = null;
 
   if (bodyStr.includes(maliciousFile.filename)) {
     let matchingPath = null;
     const unixPathPattern = /(?:\/[^\s"']+)+/g;
     const windowsPathPattern = /(?:[a-zA-Z]:\\[^\s"']+)+/g;
 
     const matches =
       bodyStr.match(unixPathPattern)?.concat(bodyStr.match(windowsPathPattern) || []) || [];
     for (const match of matches) {
       if (match.includes(maliciousFile.filename)) {
         matchingPath = match;
         break;
       }
     }
 
     if (matchingPath) {
       try {
         const possibleFileUrl = new URL(matchingPath, formActionUrl).href;
         console.log("possibleFileRUL", possibleFileUrl)
         const fileResponse = await axios.get(possibleFileUrl);
         const fileContent =
           typeof fileResponse.data === "string"
             ? fileResponse.data
             : JSON.stringify(fileResponse.data);
         if (fileContent.includes("VULNERABLE AAAAA")) {
           payloadFound = true;
           payloadUrl = possibleFileUrl;
           const contentType = fileResponse.headers["content-type"] || "";
           vulnDescription = contentType.includes("text/html")
             ? "Malicious script executed and served as HTML"
             : `Malicious file served (content type: ${contentType})`;
         }
       } catch (e) {
         console.error(`Error fetching possible file URL ${matchingPath}: ${e.message}`);
       }
     }
   } else if (redirectedUrl) {
     try {
       const getRes = await axios.get(redirectedUrl);
       const getBody = typeof getRes.data === "string" ? getRes.data : JSON.stringify(getRes.data);
       if (getBody.includes(maliciousFile.filename)) {
         try {
           const fileRes = await axios.get(redirectedUrl);
           const fileData =
             typeof fileRes.data === "string" ? fileRes.data : JSON.stringify(fileRes.data);
           if (fileData.includes("VULNERABLE AAAAA")) {
             payloadFound = true;
             payloadUrl = redirectedUrl;
             const contentType = fileRes.headers["content-type"] || "";
             vulnDescription = contentType.includes("text/html")
               ? "Malicious script executed and served as HTML"
               : `Malicious file served (content type: ${contentType})`;
           }
         } catch (e) {
           console.error(`Error validating redirected file at ${redirectedUrl}: ${e.message}`);
         }
       }
     } catch (e) {
       console.error(`Error fetching redirect URL ${redirectedUrl}: ${e.message}`);
     }
   }
 
   if (!payloadFound) {
     const fileDiscoveryUrl = await findUploadedFile(pageUrl, maliciousFile.filename);
     if (fileDiscoveryUrl) {
       payloadFound = true;
       payloadUrl = fileDiscoveryUrl;
       vulnDescription = "Uploaded file is publicly accessible on the site";
     }
   }
 
   if (payloadFound) {
     console.info(` [!!] Vulnerability found: ${vulnDescription}. URL: ${payloadUrl}`);
     vulnerableForms.push({ url: pageUrl, action: formActionUrl, description: vulnDescription });
   } else {
     console.info(` [OK] No vulnerability detected for form on ${pageUrl}.`);
   }
 }
 
 async function crawlAndTestUploads(startUrl) {
   const startDomain = new URL(startUrl).hostname;
   const visited = new Set();
   const formsToTest = [];
 
   if (Crawler) {
     console.info(`Starting crawl at ${startUrl} using crawler...`);
     const crawler = new (require("crawler"))({
       maxConnections: 5,
       callback: (error, res, done) => {
         const pageUrl = res.options.uri;
         if (error) {
           console.error(`Error fetching ${pageUrl}: ${error.message}`);
         } else {
           const $ = res.$;
           $('form:has(input[type="file"])').each((i, form) => {
             const formHtml = $.html(form);
             formsToTest.push({ formHtml, pageUrl });
           });
           $("a[href]").each((i, link) => {
             const href = $(link).attr("href");
             if (
               !href ||
               href.startsWith("#") ||
               href.startsWith("javascript:") ||
               href.startsWith("mailto:")
             )
               return;
             let newUrl;
             try {
               newUrl = new URL(href, pageUrl).href;
             } catch {
               return;
             }
             const newDomain = new URL(newUrl).hostname;
             if (newDomain === startDomain && !visited.has(newUrl)) {
               visited.add(newUrl);
               crawler.queue(newUrl);
             }
           });
         }
         done();
       },
     });
     visited.add(startUrl);
     crawler.queue(startUrl);
     await new Promise((resolve) => crawler.on("drain", resolve));
   } else {
     console.info(`Starting crawl at ${startUrl} (manual mode)...`);
     const queue = [startUrl];
     visited.add(startUrl);
     while (queue.length > 0) {
       const url = queue.shift();
       let response;
       try {
         response = await axios.get(url);
       } catch (err) {
         console.error(`Error fetching ${url}: ${err.message}`);
         continue;
       }
       const $ = cheerio.load(response.data);
       $('form:has(input[type="file"])').each((i, form) => {
         const formHtml = $.html(form);
         formsToTest.push({ formHtml, pageUrl: url });
       });
       $("a[href]").each((i, link) => {
         const href = $(link).attr("href");
         if (
           !href ||
           href.startsWith("#") ||
           href.startsWith("javascript:") ||
           href.startsWith("mailto:")
         )
           return;
         let newUrl;
         try {
           newUrl = new URL(href, url).href;
         } catch {
           return;
         }
         const newDomain = new URL(newUrl).hostname;
         if (newDomain === startDomain && !visited.has(newUrl)) {
           visited.add(newUrl);
           queue.push(newUrl);
         }
       });
     }
   }
   console.info(`Crawling completed. Found ${formsToTest.length} form(s) with file inputs.`);
   const vulnerableForms = [];
   for (const { formHtml, pageUrl } of formsToTest) {
     await analyzeUploadForm(formHtml, pageUrl, vulnerableForms);
   }
   console.info("=== Summary of File Upload Form Tests ===");
   if (vulnerableForms.length > 0) {
     console.info("Vulnerable forms found:");
     vulnerableForms.forEach(({ url, action, description }) => {
       console.info(`- Form on page ${url} (action: ${action}) -> ${description}`);
     });
   } else {
     console.info("No vulnerable file upload forms found.");
   }
 }
 
 if (require.main === module) {
   const startUrl = process.argv[2];
   if (!startUrl) {
     console.error("Usage: node uploadTest.js <startUrl>");
     process.exit(1);
   }
   crawlAndTestUploads(startUrl).catch((err) => {
     console.error("Error during crawlAndTestUploads:", err);
   });
 }
 
 module.exports = {
   crawlAndTestUploads,
   analyzeUploadForm,
 };
 