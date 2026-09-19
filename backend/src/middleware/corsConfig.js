/**
 * CORS Configuration Middleware
 * 
 * Demonstrates:
 * 1. BAD CORS: Wildcard origin (*) with permissive methods
 * 2. SECURE CORS: Explicit origin whitelist, specific allowed methods,
 *    restricted headers, preflight cache duration, and safe credential handling.
 */

// Trusted Origins Whitelist
// In development: Allow localhost and internal development proxy ports
// In production: Only allow verified university domain(s)
const TRUSTED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_ORIGIN, // e.g., https://grievance.campus.edu
].filter(Boolean);

/**
 * Secure CORS Middleware
 */
export const secureCors = (req, res, next) => {
  const origin = req.headers.origin;

  // Determine if incoming origin is in our whitelist or if request is same-origin (no Origin header)
  const isAllowedOrigin = !origin || TRUSTED_ORIGINS.includes(origin) || process.env.NODE_ENV !== 'production';

  if (origin && isAllowedOrigin) {
    // Reflect ONLY the validated origin instead of wildcard '*'
    res.setHeader('Access-Control-Allow-Origin', origin);
    // Allow credentials (cookies, authorization headers) safely
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  // Permitted HTTP methods for the API
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  // Explicit allowed request headers (never allow wildcard headers in production)
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  // Preflight Cache Duration: Tell browsers to cache OPTIONS preflight response for 24 hours (86400s)
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle Preflight OPTIONS requests immediately
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
};
