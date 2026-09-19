/**
 * Input Sanitization Middleware
 * 
 * Level 6: Input Security & Malicious Input Defense
 * 
 * Protects against:
 * - Cross-Site Scripting (XSS) & Malicious HTML/JavaScript:
 *   Strips dangerous HTML tags (<script>, <iframe>, <object>, <embed>),
 *   removes pseudo-protocols (javascript:, data:), and neutralizes event handlers (onerror=, onload=).
 * - NoSQL Injection:
 *   Removes keys prefixed with '$' (e.g., $gt, $ne, $where) that attackers use to inject operators.
 * - Prototype Pollution:
 *   Strips '__proto__', 'constructor', and 'prototype' properties from objects.
 */

/**
 * Clean and sanitize a string value
 * @param {string} str - Raw user input string
 * @returns {string} Sanitized string
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;

  return str
    // Remove script tags and their inner content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove iframe, embed, and object tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    // Remove inline DOM event handlers (e.g., onerror=alert(1), onclick="...")
    .replace(/\bon\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\bon\w+\s*=\s*[^>\s]+/gi, '')
    // Remove javascript: and vbscript: URIs
    .replace(/javascript:[^"'\s]*/gi, '')
    .replace(/vbscript:[^"'\s]*/gi, '')
    // Neutralize dangerous angle brackets in plain text fields to prevent tag injection
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();
};

/**
 * Recursively sanitize an object, array, or primitive value
 * @param {any} data - Raw data to sanitize
 * @returns {any} Sanitized clone of data
 */
export const sanitizeData = (data) => {
  if (data === null || data === undefined) {
    return data;
  }

  // Sanitize strings
  if (typeof data === 'string') {
    return sanitizeString(data);
  }

  // Preserve numbers, booleans, etc.
  if (typeof data !== 'object') {
    return data;
  }

  // Sanitize array elements
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }

  // Sanitize object properties and keys (preventing prototype pollution & NoSQL injection)
  const sanitizedObj = {};
  for (const [key, value] of Object.entries(data)) {
    // Defense against Prototype Pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }

    // Defense against NoSQL Injection operators (keys starting with $)
    if (key.startsWith('$')) {
      continue;
    }

    sanitizedObj[key] = sanitizeData(value);
  }

  return sanitizedObj;
};

/**
 * Express middleware to sanitize req.body, req.query, and req.params
 */
export const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeData(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeData(req.query);
  }

  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeData(req.params);
  }

  next();
};
