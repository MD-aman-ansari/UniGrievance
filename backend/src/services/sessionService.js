/**
 * Session & Token Invalidation Service
 * 
 * Level 8: Session and Cookie Security Management
 * 
 * Provides:
 * 1. Secure Cookie Configuration Factory
 * 2. Invalidation / Revocation Blacklist for Active Sessions
 * 3. Session Expiration Handling
 */

export const SESSION_COOKIE_NAME = 'unigrievance_session';

// In-memory revoked token set (stores token signatures and their expiration timestamp)
const revokedTokens = new Map();

// Periodic cleanup of expired tokens from the blacklist map
setInterval(() => {
  const now = Date.now();
  for (const [tokenSig, expiresAt] of revokedTokens.entries()) {
    if (now > expiresAt) {
      revokedTokens.delete(tokenSig);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour

/**
 * Generates OWASP-compliant secure cookie options
 */
export const getSecureCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    // 1. HttpOnly: Forbids JavaScript (document.cookie) from reading the cookie
    // Eliminates XSS-based session token theft
    httpOnly: true,

    // 2. Secure: Transmits cookie exclusively over TLS/HTTPS encrypted connections
    // Prevents Man-in-the-Middle (MITM) cleartext interception
    secure: isProduction,

    // 3. SameSite: Controls cross-site request cookie inclusion
    // 'lax' allows top-level navigation while blocking cross-site background requests (CSRF protection)
    sameSite: 'lax',

    // 4. Session Expiration: 7 days in milliseconds
    maxAge: 7 * 24 * 60 * 60 * 1000,

    // 5. Path: Scoped to entire domain
    path: '/',
  };
};

/**
 * Invalidates / revokes a session token on server-side logout
 */
export const invalidateSession = (token, decodedExpSeconds) => {
  if (!token) return;
  // Use last 32 characters or signature portion of the token as identifier
  const tokenSignature = token.slice(-32);
  const expiresAtMs = decodedExpSeconds ? decodedExpSeconds * 1000 : Date.now() + (7 * 24 * 60 * 60 * 1000);
  revokedTokens.set(tokenSignature, expiresAtMs);
};

/**
 * Checks if a session token has been revoked / logged out
 */
export const isSessionRevoked = (token) => {
  if (!token) return false;
  const tokenSignature = token.slice(-32);
  return revokedTokens.has(tokenSignature);
};
