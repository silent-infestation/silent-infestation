import axios from 'axios';
import * as cheerio from 'cheerio';
import Crawler from 'crawler';
import { NextResponse } from 'next/server';
import { URL } from 'url';
import https from 'https';

// Set pour suivre les URLs visitées et éviter les duplications
const visitedUrls = new Set();

/**
 * Configuration des tests de bruteforce
 * Ces paramètres peuvent être ajustés selon les besoins spécifiques du test
 */
const bruteforceConfig = {
  maxAttempts: 20,            // Nombre total de tentatives de connexion à effectuer
  delayBetweenAttempts: 200,  // Délai entre les tentatives en millisecondes (pour ne pas surcharger le serveur)
  timeoutThreshold: 5000,     // Seuil en ms au-dessus duquel on considère qu'une temporisation est appliquée
  credentials: [
    { username: 'testuser', password: 'wrongpass1' },
    { username: 'testuser', password: 'wrongpass2' },
    // ... autres combinaisons peuvent être ajoutées ici
  ],
  // Fonction qui génère un mot de passe différent pour chaque tentative
  generatePassword: (attempt) => `wrongpass${attempt}`
};

// Agent HTTPS qui ignore les erreurs de certificat
const httpsAgent = new https.Agent({
  rejectUnauthorized: false // Ne pas vérifier la validité des certificats SSL
});

/**
 * Fonction principale pour détecter les mesures anti-bruteforce sur un formulaire
 * 
 * @param {string} formUrl - URL du formulaire à tester
 * @param {Object} formData - Données du formulaire (champs et valeurs par défaut)
 * @param {string} method - Méthode HTTP (GET ou POST)
 * @param {string} formName - Nom ou identifiant du formulaire pour le rapport
 * @returns {Object} Résultats des tests avec les protections détectées
 */
async function detectAntiBruteforceProtection(formUrl, formData, method, formName) {
  console.info(`Testing bruteforce protection on ${formUrl} (${formName || 'unnamed form'})`);
  
  // Structure pour stocker tous les résultats des tests
  const results = {
    formUrl,
    formName,
    attempts: [],             // Détails de chaque tentative
    findings: {
      hasRateLimiting: false, // Si le serveur limite le nombre de tentatives
      hasProgressiveDelay: false, // Si le délai augmente progressivement
      hasCaptcha: false,      // Si un CAPTCHA apparaît après plusieurs tentatives
      hasAccountLockout: false, // Si le compte se verrouille temporairement
      timings: []             // Temps de réponse de chaque tentative
    }
  };

  let previousResponseTime = 0;     // Pour comparer les temps de réponse entre tentatives
  let consecutiveDelays = 0;        // Compteur de délais consécutifs détectés
  let blockedAttempt = null;        // À quelle tentative le blocage est survenu
  
  // Boucle principale: effectuer plusieurs tentatives de connexion
  for (let i = 0; i < bruteforceConfig.maxAttempts; i++) {
    // Utiliser un nom d'utilisateur fixe mais un mot de passe différent à chaque fois
    const username = bruteforceConfig.credentials[0]?.username || 'testuser';
    const password = bruteforceConfig.generatePassword(i);
    
    // Créer une copie des données du formulaire pour ne pas modifier l'original
    const testData = { ...formData };
    
    // Identifier automatiquement les champs de formulaire pour username et password
    // en se basant sur des conventions de nommage courantes
    const usernameField = Object.keys(testData).find(field => 
      field.toLowerCase().includes('user') || 
      field.toLowerCase().includes('email') || 
      field.toLowerCase().includes('login') ||
      field.toLowerCase().includes('name')
    ) || Object.keys(testData)[0]; // Si aucun match, prendre le premier champ
    
    const passwordField = Object.keys(testData).find(field => 
      field.toLowerCase().includes('pass') || 
      field.toLowerCase().includes('pwd')
    ) || Object.keys(testData)[1]; // Si aucun match, prendre le deuxième champ
    
    // Remplacer les valeurs par nos données de test
    if (usernameField) testData[usernameField] = username;
    if (passwordField) testData[passwordField] = password;
    
    try {
      const startTime = Date.now(); // Mesurer le temps de début
      let response;
      
      // Envoyer la requête avec la méthode appropriée (POST ou GET)
      if (method.toUpperCase() === 'POST') {
        response = await axios.post(formUrl, new URLSearchParams(testData), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 30000, // 30 secondes de timeout max
          validateStatus: () => true, // Accepter tous les codes de statut (même 4xx, 5xx)
          httpsAgent: httpsAgent // Utiliser l'agent qui ignore les erreurs de certificat
        });
      } else {
        response = await axios.get(`${formUrl}?${new URLSearchParams(testData).toString()}`, {
          timeout: 30000,
          validateStatus: () => true,
          httpsAgent: httpsAgent // Utiliser l'agent qui ignore les erreurs de certificat
        });
      }
      
      // Calculer le temps de réponse
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      results.findings.timings.push(responseTime);
      
      // Vérifier la présence de CAPTCHA dans la réponse
      // en cherchant des indices dans le HTML et les classes/ids
      const $ = cheerio.load(response.data);
      const hasCaptcha = 
        $('[class*="captcha"]').length > 0 || 
        $('[id*="captcha"]').length > 0 || 
        $('img[src*="captcha"]').length > 0 ||
        response.data.toLowerCase().includes('captcha') ||
        $('div[class*="g-recaptcha"]').length > 0;
      
      if (hasCaptcha) {
        results.findings.hasCaptcha = true;
        blockedAttempt = i; // Enregistrer à quelle tentative le CAPTCHA est apparu
        break; // Arrêter les tests une fois que le CAPTCHA apparaît
      }
      
      // Vérifier si le temps de réponse augmente progressivement
      // ce qui indiquerait une temporisation progressive
      if (i > 0) {
        if (responseTime > previousResponseTime * 1.5 && responseTime > bruteforceConfig.timeoutThreshold) {
          consecutiveDelays++;
          if (consecutiveDelays >= 2) { // Requiert au moins 2 délais consécutifs pour confirmer
            results.findings.hasProgressiveDelay = true;
          }
        } else {
          consecutiveDelays = 0; // Réinitialiser le compteur si pas de délai détecté
        }
      }
      
      // Rechercher des indices de verrouillage de compte dans la réponse
      // en utilisant des expressions régulières pour différentes langues (EN/FR)
      const accountLockedPatterns = [
        /account.*locked/i,
        /locked.*account/i,
        /too many.*attempts/i,
        /temporarily blocked/i,
        /verrouill/i,  // Pour "verrouillé" en français
        /bloqu/i,      // Pour "bloqué" en français
        /trop de tentatives/i
      ];
      
      const isAccountLocked = accountLockedPatterns.some(pattern => 
        pattern.test(response.data) ||
        pattern.test(response.headers['x-error-message'] || '')
      );
      
      if (isAccountLocked) {
        results.findings.hasAccountLockout = true;
        blockedAttempt = i; // Enregistrer à quelle tentative le verrouillage est survenu
        break; // Arrêter les tests une fois que le compte est verrouillé
      }
      
      previousResponseTime = responseTime;
      
      // Pause courte entre les tentatives pour éviter de surcharger le serveur
      await new Promise(resolve => setTimeout(resolve, bruteforceConfig.delayBetweenAttempts));
      
      // Enregistrer les données de cette tentative pour analyse
      results.attempts.push({
        attempt: i + 1,
        status: response.status,
        responseTime: responseTime,
        headers: response.headers
      });
      
    } catch (error) {
      console.error(`Error during bruteforce test (attempt ${i+1}): ${error.message}`);
      
      // Si l'erreur est un timeout, cela peut indiquer une temporisation délibérée
      if (error.code === 'ECONNABORTED') {
        consecutiveDelays++;
        if (consecutiveDelays >= 2) {
          results.findings.hasProgressiveDelay = true;
        }
      }
      
      // Enregistrer l'erreur pour cette tentative
      results.attempts.push({
        attempt: i + 1,
        error: error.message,
        code: error.code
      });
    }
  }
  
  // Analyser les résultats pour détecter le rate limiting
  if (blockedAttempt !== null) {
    // Si un blocage a été détecté (CAPTCHA ou verrouillage), c'est une forme de rate limiting
    results.findings.hasRateLimiting = true;
    results.findings.blockedAtAttempt = blockedAttempt + 1;
  } else {
    // Détecter le rate limiting par l'analyse des temps de réponse
    // Si les réponses deviennent significativement plus lentes, c'est un signe de rate limiting
    const timings = results.findings.timings;
    let significantSlowdowns = 0;
    
    for (let i = 1; i < timings.length; i++) {
      if (timings[i] > timings[i-1] * 2 && timings[i] > bruteforceConfig.timeoutThreshold) {
        significantSlowdowns++;
      }
    }
    
    if (significantSlowdowns >= 2) {
      results.findings.hasRateLimiting = true;
    }
  }
  
  return results;
}

/**
 * Fonction pour extraire et tester tous les formulaires d'une page
 * Elle identifie les formulaires d'authentification et lance les tests pour chacun
 * 
 * @param {string} pageUrl - URL de la page à analyser
 * @returns {Array} Résultats des tests pour tous les formulaires d'authentification de la page
 */
async function extractAndTestForms(pageUrl) {
  console.info(`Extracting and testing forms on ${pageUrl}`);
  const bruteforceResults = [];
  
  try {
    // Charger la page et son contenu HTML avec l'agent qui ignore les erreurs SSL
    const response = await axios.get(pageUrl, {
      httpsAgent: httpsAgent,
      validateStatus: () => true, // Accepter tous les codes de statut
      timeout: 30000 // 30 secondes max
    });
    
    const $ = cheerio.load(response.data);
    
    // Trouver tous les formulaires de la page
    const forms = $('form');
    for (let i = 0; i < forms.length; i++) {
      const form = forms[i];
      const formAction = $(form).attr('action') || pageUrl; // URL de soumission du formulaire
      const formMethod = $(form).attr('method') || 'GET';   // Méthode de soumission (GET/POST)
      const formName = $(form).attr('name') || $(form).attr('id') || null; // Identifiant du formulaire
      const inputs = $(form).find('input, select, textarea'); // Tous les champs du formulaire
      
      // Vérifier si le formulaire semble être un formulaire d'authentification
      // en se basant sur des heuristiques (présence de champ password, mots-clés dans l'URL...)
      const isAuthForm = 
        $(form).find('input[type="password"]').length > 0 ||
        formAction.toLowerCase().includes('login') ||
        formAction.toLowerCase().includes('auth') ||
        formAction.toLowerCase().includes('connexion') ||
        formName?.toLowerCase().includes('login') ||
        formName?.toLowerCase().includes('auth') ||
        formName?.toLowerCase().includes('connexion');
      
      // Ignorer les formulaires qui ne semblent pas être des formulaires d'authentification
      if (!isAuthForm) continue;
      
      // Collecter tous les champs et leurs valeurs par défaut
      const formData = {};
      inputs.each((index, input) => {
        const name = $(input).attr('name');
        const value = $(input).attr('value') || '';
        if (name) formData[name] = value;
      });
      
      // Construire l'URL complète du formulaire
      let actionUrl = new URL(formAction, pageUrl).href;
      if (actionUrl.endsWith('#')) {
        actionUrl = actionUrl.slice(0, -1); // Supprimer le fragment # à la fin de l'URL
      }
      
      console.info(`Testing auth form: ${actionUrl} (${formMethod})`);
      // Lancer les tests de bruteforce sur ce formulaire d'authentification
      const testResults = await detectAntiBruteforceProtection(
        actionUrl, 
        formData, 
        formMethod,
        formName
      );
      
      bruteforceResults.push(testResults);
    }
  } catch (error) {
    console.error(`Error processing page ${pageUrl}: ${error.message}`);
  }
  
  return bruteforceResults;
}

/**
 * Fonction pour extraire tous les liens d'une page
 * permettant au crawler de naviguer sur le site
 * 
 * @param {Object} $ - Instance Cheerio chargée avec le HTML de la page
 * @param {string} mainDomain - Domaine principal du site pour filtrer les liens externes
 * @param {string} baseUrl - URL de la page courante (pour résoudre les URLs relatives)
 * @returns {Set} Ensemble des URLs découvertes sur la page
 */
function extractLinks($, mainDomain, baseUrl) {
  console.info(`Extracting links from ${baseUrl}`);
  const links = new Set();
  $('a').each((index, element) => {
    const href = $(element).attr('href');
    if (href) {
      try {
        // Convertir les URLs relatives en URLs absolues
        const fullUrl = new URL(href, baseUrl).href;
        const urlObj = new URL(fullUrl);
        // Ignorer les liens vers des images et autres fichiers non-HTML
        if (/\.(jpg|jpeg|png|gif|bmp|svg|webp|yml|yaml)$/i.test(urlObj.pathname)) return;
        // Ne conserver que les liens vers le même domaine (ne pas sortir du site)
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

/**
 * Fonction sécurisée pour récupérer l'URL de la page à partir de l'objet de réponse du crawler
 * Essaie plusieurs chemins d'accès possibles pour trouver l'URL
 * 
 * @param {Object} res - Objet de réponse du crawler
 * @returns {string|null} L'URL de la page ou null si introuvable
 */
function getPageUrlFromResponse(res) {
  // Essayer différents chemins pour trouver l'URL
  if (typeof res.options?.uri === 'string') {
    return res.options.uri;
  }
  
  if (typeof res.options?.url === 'string') {
    return res.options.url;
  }
  
  if (res.request && typeof res.request.uri?.href === 'string') {
    return res.request.uri.href;
  }
  
  if (res.request && typeof res.request.href === 'string') {
    return res.request.href;
  }
  
  if (res.request && typeof res.request.url === 'string') {
    return res.request.url;
  }
  
  if (res.request && typeof res.request.uri === 'string') {
    return res.request.uri;
  }
  
  // Si toutes les tentatives échouent, enregistrer l'erreur et retourner null
  console.error('Could not extract URL from crawler response');
  return null;
}

/**
 * Fonction principale pour démarrer le crawler de test de bruteforce
 * Elle explore le site et teste tous les formulaires d'authentification trouvés
 * 
 * @param {string} startUrl - URL de départ pour le crawler
 * @returns {Promise<Array>} Résultats des tests pour tous les formulaires trouvés
 */
async function startBruteforceTesting(startUrl) {
  console.info(`Starting bruteforce testing at ${startUrl}`);
  const mainDomain = new URL(startUrl).hostname;
  const allBruteforceResults = [];
  
  // Configurer le crawler avec un callback qui sera exécuté pour chaque page
  const crawler = new Crawler({
    maxConnections: 5, // Nombre max de requêtes simultanées
    retries: 2,        // Nombre de tentatives en cas d'échec
    jQuery: true,      // Activer le parsing jQuery/Cheerio
    // Utiliser cette configuration pour ignorer les erreurs SSL
    strictSSL: false,
    
    callback: async (error, res, done) => {
      if (error) {
        console.error(`Error crawling: ${error.message}`);
      } else {
        const $ = res.$;
        
        // Utiliser la fonction sécurisée pour récupérer l'URL
        const pageUrl = getPageUrlFromResponse(res);
        
        if ($ && pageUrl) {
          console.info(`Processing page: ${pageUrl}`);
          visitedUrls.add(pageUrl); // Marquer cette URL comme visitée
          
          // Extraire et tester les formulaires de cette page
          const formResults = await extractAndTestForms(pageUrl);
          if (formResults.length > 0) {
            allBruteforceResults.push(...formResults);
          }
          
          // Extraire les liens de cette page pour continuer l'exploration
          const links = extractLinks($, mainDomain, pageUrl);
          links.forEach((link) => {
            if (!visitedUrls.has(link)) {
              visitedUrls.add(link); // Marquer comme visitée pour éviter les duplications
              // Ajouter l'URL à la file d'attente du crawler
              try {
                crawler.queue(link);
              } catch (err) {
                console.error(`Error queueing URL ${link}: ${err.message}`);
              }
            }
          });
        } else {
          console.warn(`Skipping page processing: Missing either $ or pageUrl`);
        }
      }
      done();
    }
  });
  
  // Retourner une promesse qui sera résolue quand le crawler aura terminé
  return new Promise((resolve) => {
    // Ajouter l'URL initiale à la file d'attente
    try {
      crawler.queue(startUrl);
    } catch (err) {
      console.error(`Error queueing initial URL ${startUrl}: ${err.message}`);
      // Même en cas d'erreur au démarrage, retourner un résultat vide pour éviter un crash
      resolve([]);
      return;
    }
    
    crawler.on('drain', () => {
      console.info('Bruteforce testing finished', allBruteforceResults.length, 'forms tested.');
      resolve(allBruteforceResults);
    });
  });
}

/**
 * Ressources recommandées pour l'implémentation des mesures anti-bruteforce
 */
const securityResources = {
  rateLimiting: [
    {
      title: "Express Rate Limit",
      url: "https://github.com/express-rate-limit/express-rate-limit",
      description: "Middleware Node.js/Express pour limiter le nombre de requêtes"
    },
    {
      title: "Rate Limiting avec Nginx",
      url: "https://www.nginx.com/blog/rate-limiting-nginx/",
      description: "Configuration du rate limiting au niveau du serveur web"
    },
    {
      title: "Guide OWASP sur le Rate Limiting",
      url: "https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html#rate-limiting",
      description: "Bonnes pratiques pour l'implémentation du rate limiting"
    }
  ],
  progressiveDelay: [
    {
      title: "Temporisation Progressive avec bcrypt",
      url: "https://github.com/kelektiv/node.bcrypt.js#a-note-on-rounds",
      description: "Utiliser bcrypt pour créer une temporisation naturelle dans le processus d'authentification"
    },
    {
      title: "Implémentation de délais exponentiels",
      url: "https://en.wikipedia.org/wiki/Exponential_backoff",
      description: "Implémentation d'algorithmes de backoff exponentiel"
    }
  ],
  captcha: [
    {
      title: "Google reCAPTCHA",
      url: "https://www.google.com/recaptcha/about/",
      description: "Service de CAPTCHA facile à implémenter et efficace"
    },
    {
      title: "hCaptcha",
      url: "https://www.hcaptcha.com/",
      description: "Alternative à reCAPTCHA respectueuse de la vie privée"
    },
    {
      title: "Guide d'intégration de CAPTCHA avec React",
      url: "https://developers.google.com/recaptcha/docs/display",
      description: "Documentation pour l'intégration de reCAPTCHA dans une application web"
    }
  ],
  accountLockout: [
    {
      title: "Guide OWASP sur le verrouillage de compte",
      url: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#account-lockout",
      description: "Recommandations pour l'implémentation sécurisée du verrouillage de compte"
    },
    {
      title: "Passport.js - Stratégies d'authentification",
      url: "http://www.passportjs.org/",
      description: "Framework pour l'authentification dans Node.js avec support pour le verrouillage de compte"
    }
  ],
  generalSecurity: [
    {
      title: "OWASP Top 10",
      url: "https://owasp.org/www-project-top-ten/",
      description: "Les dix risques de sécurité les plus critiques pour les applications web"
    },
    {
      title: "Auth0 - Sécurité de l'authentification",
      url: "https://auth0.com/blog/",
      description: "Articles et guides sur la sécurité de l'authentification"
    },
    {
      title: "MDN - Sécurité des applications web",
      url: "https://developer.mozilla.org/en-US/docs/Web/Security",
      description: "Documentation complète sur la sécurité web"
    }
  ]
};

/**
 * Fonction pour générer un rapport de synthèse des résultats
 * Elle résume les vulnérabilités trouvées et propose des recommandations
 * 
 * @param {Array} results - Résultats des tests de tous les formulaires
 * @returns {Object} Rapport de synthèse
 */
function generateSummaryReport(results) {
  console.info(`Generating summary report for ${results.length} forms`);
  
  const summary = {
    totalFormsTested: results.length,
    vulnerableForms: 0,          // Nombre de formulaires sans protection
    protectedForms: 0,           // Nombre de formulaires avec au moins une protection
    detailedFindings: [],        // Détails pour chaque formulaire
    recommendations: [],         // Recommandations de sécurité
    resources: {}                // Ressources pour l'implémentation des recommandations
  };
  
  // Analyser chaque résultat pour générer la synthèse
  results.forEach(result => {
    const isProtected = 
      result.findings.hasRateLimiting || 
      result.findings.hasProgressiveDelay || 
      result.findings.hasCaptcha ||
      result.findings.hasAccountLockout;
    
    if (isProtected) {
      summary.protectedForms++;
    } else {
      summary.vulnerableForms++;
    }
    
    // Ajouter les détails de ce formulaire au rapport
    summary.detailedFindings.push({
      url: result.formUrl,
      formName: result.formName || 'unnamed form',
      protectionLevel: isProtected ? 'Protected' : 'Vulnerable',
      protections: {
        rateLimiting: result.findings.hasRateLimiting,
        progressiveDelay: result.findings.hasProgressiveDelay,
        captcha: result.findings.hasCaptcha,
        accountLockout: result.findings.hasAccountLockout
      }
    });
  });
  
  // Générer des recommandations en fonction des vulnérabilités détectées
  if (summary.vulnerableForms > 0) {
    // Recommandations avec identifiants pour lier aux ressources
    summary.recommendations.push({
      id: "rateLimiting",
      text: "Implémenter un rate limiting sur tous les formulaires d'authentification",
      priority: "Haute"
    });
    
    summary.recommendations.push({
      id: "progressiveDelay",
      text: "Ajouter une temporisation progressive après des échecs successifs",
      priority: "Moyenne"
    });
    
    summary.recommendations.push({
      id: "captcha",
      text: "Envisager l'ajout de CAPTCHA après 3-5 tentatives échouées",
      priority: "Haute"
    });
    
    summary.recommendations.push({
      id: "accountLockout",
      text: "Mettre en place un verrouillage temporaire de compte après multiple échecs",
      priority: "Moyenne"
    });
    
    // Ajouter toutes les ressources pour aider à la mise en œuvre
    summary.resources = securityResources;
  }
  
  return summary;
}

/**
 * Route API pour lancer les tests depuis une application Next.js
 * Accessible via une requête POST avec l'URL de départ
 * 
 * @param {Object} req - Requête HTTP
 * @returns {NextResponse} Réponse HTTP avec les résultats des tests
 */
export async function POST(req) {
  const { startUrl } = await req.json();
  if (!startUrl) {
    console.error('startUrl is required but missing.');
    return NextResponse.json({ error: 'startUrl is required' }, { status: 400 });
  }
  
  console.info(`Received bruteforce testing request with startUrl: ${startUrl}`);
  
  try {
    // Lancer les tests et générer le rapport
    const bruteforceResults = await startBruteforceTesting(startUrl);
    const summaryReport = generateSummaryReport(bruteforceResults);
    
    console.info('Bruteforce testing complete.');
    return NextResponse.json({
      bruteforceResults,  // Résultats détaillés pour chaque formulaire
      summaryReport       // Synthèse et recommandations
    });
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}