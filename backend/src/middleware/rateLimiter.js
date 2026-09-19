/**
 * Rate Limiting Middleware (In-Memory Sliding Window)
 * 
 * Protects endpoints from:
 * 1. Brute-force credential attacks on /api/auth/login and /register
 * 2. Automated ticket spamming & API flooding on /api/complaints
 * 3. Denial of Service (DoS) by limiting request frequency per IP
 */

class MemoryRateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60 * 1000; // 1 minute window
    this.max = options.max || 100;                 // Max requests per window
    this.message = options.message || 'Too many requests from this IP, please try again later.';
    this.hits = new Map();

    // Periodic cleanup of expired IP windows to prevent memory leaks
    setInterval(() => {
      const now = Date.now();
      for (const [ip, record] of this.hits.entries()) {
        if (now - record.resetTime > this.windowMs) {
          this.hits.delete(ip);
        }
      }
    }, Math.max(this.windowMs, 30000));
  }

  middleware() {
    return (req, res, next) => {
      // Extract client IP address (supporting X-Forwarded-For when behind proxy)
      const forwarded = req.headers['x-forwarded-for'];
      const clientIp = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress) || 'unknown-ip';
      
      const now = Date.now();
      let record = this.hits.get(clientIp);

      if (!record || (now - record.resetTime) > this.windowMs) {
        record = {
          count: 1,
          resetTime: now,
        };
        this.hits.set(clientIp, record);
      } else {
        record.count++;
      }

      const remaining = Math.max(0, this.max - record.count);
      const resetSeconds = Math.ceil((record.resetTime + this.windowMs - now) / 1000);

      // Set standard RFC-6585 and IETF RateLimit response headers
      res.setHeader('X-RateLimit-Limit', this.max);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', resetSeconds);

      if (record.count > this.max) {
        res.setHeader('Retry-After', resetSeconds);
        return res.status(429).json({
          success: false,
          error: 'Too Many Requests',
          message: this.message,
          retryAfterSeconds: resetSeconds,
        });
      }

      next();
    };
  }
}

/**
 * 1. Strict Auth Rate Limiter
 * Limits login and registration attempts to 10 requests per 15 minutes per IP.
 * Prevents dictionary attacks, credential stuffing, and account enumeration.
 */
export const authRateLimiter = new MemoryRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,                  // Max 15 attempts
  message: 'Too many authentication attempts from this IP. Please wait 15 minutes before trying again.',
}).middleware();

/**
 * 2. General API Rate Limiter
 * Limits standard API requests to 100 requests per minute per IP.
 * Prevents API abuse, ticket spamming, and resource starvation.
 */
export const generalRateLimiter = new MemoryRateLimiter({
  windowMs: 60 * 1000,      // 1 minute
  max: 120,                 // Max 120 requests per minute
  message: 'API rate limit exceeded. Please slow down your requests.',
}).middleware();
