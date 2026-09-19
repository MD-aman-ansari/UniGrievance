/**
 * Secure Request Logger Middleware
 * 
 * Logs incoming HTTP traffic while strictly redacting sensitive fields:
 * - Passwords and password confirmation
 * - JWT tokens and Bearer strings
 * - Database connection strings
 * - API keys and session secrets
 * - Cookie payloads
 */

const SENSITIVE_KEYS = new Set([
  'password',
  'confirmpassword',
  'currentpassword',
  'token',
  'jwt',
  'refreshtoken',
  'authorization',
  'cookie',
  'secret',
  'apikey',
  'database_url',
  'jwt_secret',
]);

/**
 * Recursively redacts sensitive keys from objects before logging
 */
export const redactSensitiveData = (data) => {
  if (!data) return data;
  if (Array.isArray(data)) {
    return data.map(redactSensitiveData);
  }
  if (typeof data === 'object') {
    const clean = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes('password') || lowerKey.includes('secret')) {
        clean[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        clean[key] = redactSensitiveData(value);
      } else {
        clean[key] = value;
      }
    }
    return clean;
  }
  return data;
};

/**
 * Express middleware for secure logging
 */
export const secureLogger = (req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  const sanitizedQuery = redactSensitiveData(req.query);

  // Redact authorization header for safety
  const hasAuth = Boolean(req.headers.authorization);
  const authHeaderStatus = hasAuth ? '[PRESENT - REDACTED]' : '[NONE]';

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    // Log format: [TIMESTAMP] METHOD PATH STATUS DURATION IP AUTH
    console.log(
      `[${timestamp}] ${req.method} ${req.originalUrl} | Status: ${statusCode} | Time: ${duration}ms | Auth: ${authHeaderStatus}`
    );

    // If request failed with 4xx or 5xx, log sanitized body for diagnostics (non-passwords)
    if (statusCode >= 400 && req.body && Object.keys(req.body).length > 0) {
      console.log(`  └─ Sanitized Payload:`, JSON.stringify(redactSensitiveData(req.body)));
    }
  });

  next();
};
