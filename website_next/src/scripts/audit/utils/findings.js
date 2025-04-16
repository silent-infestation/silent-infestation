import { updatePartialData } from "./globals";

/**
 * Creates a `noteFinding` function scoped to a user session.
 * This factory binds the userId, partialData, and recordedFindings together,
 * so the returned function can safely log security findings without duplicating.
 *
 * @param {Set} recordedFindings - Used to deduplicate findings
 * @param {string} userId - Current user's unique ID
 * @param {object} partialData - Mutable object holding scan progress
 * @returns {Function} noteFinding(type, url, detail, options)
 */
export function noteFindingFactory(recordedFindings, userId, partialData) {
  return function noteFinding(type, url, detail, options = {}) {
    let domain;
    try {
      domain = new URL(url).hostname;
    } catch {
      domain = url; // fallback if URL parsing fails
    }

    const signature = `${type}::${domain}::${detail}`;
    if (recordedFindings.has(signature)) return; // skip duplicates
    recordedFindings.add(signature);

    const { confidence = "medium", severity = "medium" } = options;
    partialData.securityFindings.push({ type, url, detail, confidence, severity });

    updatePartialData(userId, partialData); // push update to global map
  };
}

/**
 * Generates a high-level summary of all findings.
 * Groups recommendations and resource links based on types of vulnerabilities found.
 *
 * @param {Array} findings - List of finding objects (type, detail, etc.)
 * @param {object} findingToRecommendation - Maps finding types to advice and mitigation
 * @param {object} securityResources - Collection of categorized educational links
 * @returns {object} summary object with recommendations and relevant resources
 */
export function generateSummaryReport(findings, findingToRecommendation, securityResources) {
  const recommendations = [];
  const resourceSet = new Set();

  for (const vuln of findings) {
    const rec = findingToRecommendation[vuln.type];
    if (rec) {
      recommendations.push(rec);
      resourceSet.add(rec.id);
    }
  }

  const resources = {};
  for (const id of resourceSet) {
    resources[id] = securityResources[id];
  }

  return {
    recommendations,
    resources,
    totalFindings: findings.length,
  };
}

// Maps vulnerability types to remediation guidance
export const findingToRecommendation = {
  no_rate_limit_detected: {
    id: "rateLimiting",
    text: "Implémenter un rate limiting sur tous les formulaires d'authentification",
    priority: "Haute",
  },
  progressive_delay_detected: {
    id: "progressiveDelay",
    text: "Ajouter une temporisation progressive après des échecs successifs",
    priority: "Moyenne",
  },
  default_or_weak_creds: {
    id: "accountLockout",
    text: "Mettre en place un verrouillage temporaire de compte après multiple échecs",
    priority: "Moyenne",
  },
  csrf_token_missing: {
    id: "generalSecurity",
    text: "Ajouter un token CSRF dans les formulaires sensibles",
    priority: "Haute",
  },
  improper_jwt_handling: {
    id: "generalSecurity",
    text: "Vérifier la configuration des JWT (signature, algorithme)",
    priority: "Haute",
  },
  insecure_transport: {
    id: "generalSecurity",
    text: "Rediriger automatiquement vers HTTPS",
    priority: "Critique",
  },
  credentials_in_url: {
    id: "generalSecurity",
    text: "Éviter de transmettre des informations sensibles dans les paramètres d'URL (ex: tokens, mots de passe)",
    priority: "Haute",
  },
  insecure_cookie: {
    id: "generalSecurity",
    text: "Configurer les cookies sensibles avec les attributs Secure et HttpOnly",
    priority: "Haute",
  },
  potential_insecure_reset: {
    id: "generalSecurity",
    text: "S'assurer que les flux de réinitialisation de mot de passe sont sécurisés (token à usage unique, expiration rapide)",
    priority: "Moyenne",
  },
  sql_injection_response: {
    id: "generalSecurity",
    text: "Utiliser des requêtes paramétrées pour toutes les entrées utilisateur afin d'éviter les injections SQL",
    priority: "Critique",
  },
  possible_injection_response: {
    id: "generalSecurity",
    text: "Utiliser des requêtes paramétrées pour toutes les entrées utilisateur afin d'éviter les injections SQL",
    priority: "Critique",
  },
  testing_string_response: {
    id: "generalSecurity",
    text: "Éviter de renvoyer des messages d'erreur contenant des informations internes ou de debug",
    priority: "Moyenne",
  },
};

// Educational security references grouped by category
export const securityResources = {
  rateLimiting: [
    {
      title: "Express Rate Limit",
      url: "https://github.com/express-rate-limit/express-rate-limit",
      description: "Middleware Node.js/Express pour limiter le nombre de requêtes",
    },
    {
      title: "Rate Limiting avec Nginx",
      url: "https://www.nginx.com/blog/rate-limiting-nginx/",
      description: "Configuration du rate limiting au niveau du serveur web",
    },
    {
      title: "Guide OWASP sur le Rate Limiting",
      url: "https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html#rate-limiting",
      description: "Bonnes pratiques pour l'implémentation du rate limiting",
    },
  ],
  progressiveDelay: [
    {
      title: "Temporisation Progressive avec bcrypt",
      url: "https://github.com/kelektiv/node.bcrypt.js#a-note-on-rounds",
      description:
        "Utiliser bcrypt pour créer une temporisation naturelle dans le processus d'authentification",
    },
    {
      title: "Implémentation de délais exponentiels",
      url: "https://en.wikipedia.org/wiki/Exponential_backoff",
      description: "Implémentation d'algorithmes de backoff exponentiel",
    },
  ],
  captcha: [
    {
      title: "Google reCAPTCHA",
      url: "https://www.google.com/recaptcha/about/",
      description: "Service de CAPTCHA facile à implémenter et efficace",
    },
    {
      title: "hCaptcha",
      url: "https://www.hcaptcha.com/",
      description: "Alternative à reCAPTCHA respectueuse de la vie privée",
    },
    {
      title: "Guide d'intégration de CAPTCHA avec React",
      url: "https://developers.google.com/recaptcha/docs/display",
      description: "Documentation pour l'intégration de reCAPTCHA dans une application web",
    },
  ],
  accountLockout: [
    {
      title: "Guide OWASP sur le verrouillage de compte",
      url: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#account-lockout",
      description: "Recommandations pour l'implémentation sécurisée du verrouillage de compte",
    },
    {
      title: "Passport.js - Stratégies d'authentification",
      url: "http://www.passportjs.org/",
      description:
        "Framework pour l'authentification dans Node.js avec support pour le verrouillage de compte",
    },
  ],
  generalSecurity: [
    {
      title: "OWASP Top 10",
      url: "https://owasp.org/www-project-top-ten/",
      description: "Les dix risques de sécurité les plus critiques pour les applications web",
    },
    {
      title: "Auth0 - Sécurité de l'authentification",
      url: "https://auth0.com/blog/",
      description: "Articles et guides sur la sécurité de l'authentification",
    },
    {
      title: "MDN - Sécurité des applications web",
      url: "https://developer.mozilla.org/en-US/docs/Web/Security",
      description: "Documentation complète sur la sécurité web",
    },
  ],
};
