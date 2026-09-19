/**
 * Security HTTP Headers Middleware
 * 
 * Implements security headers following OWASP recommendations:
 * 1. Disables 'X-Powered-By' to prevent technology fingerprinting
 * 2. Enforces 'X-Content-Type-Options: nosniff' to disable MIME-type sniffing
 * 3. Enforces 'X-Frame-Options: SAMEORIGIN' to prevent clickjacking in foreign iframes
 * 4. Configures 'Strict-Transport-Security' (HSTS) for HTTPS enforcement
 * 5. Configures 'Referrer-Policy' to prevent leaking URLs to third parties
 * 6. Configures 'Permissions-Policy' to restrict unauthorized sensor access
 */

export const securityHeaders = (req, res, next) => {
  // 1. Prevent technology fingerprinting (Express identification)
  res.removeHeader('X-Powered-By');

  // 2. Prevent MIME type sniffing: Forces browsers to honor declared Content-Type
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // 3. Clickjacking protection: Disallows framing by foreign origin domains
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // 4. Legacy XSS filter protection for older browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // 5. Strict Transport Security (HSTS): Enforce HTTPS connections
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // 6. Referrer Policy: Send full referrer on same-origin, strip path cross-origin
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 7. Permissions Policy: Restrict access to sensitive device APIs
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // 8. Cache control for authenticated API responses to prevent local disk caching of sensitive data
  if (req.originalUrl && req.originalUrl.startsWith('/api/') && req.method !== 'GET') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
};
