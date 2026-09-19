/**
 * Express Application Setup
 * 
 * Configures application middleware, API routes, and error handling.
 * Separation of app.js and server.js allows app to be tested in isolation
 * without starting network listeners.
 */

import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import complaintsRoutes from './routes/complaintsRoutes.js';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { getDbStatus } from './config/db.js';
import { sanitizeInput } from './middleware/sanitizer.js';
import { securityHeaders } from './middleware/securityHeaders.js';
import { secureCors } from './middleware/corsConfig.js';
import { generalRateLimiter } from './middleware/rateLimiter.js';
import { secureLogger } from './middleware/logger.js';

const app = express();

// 1. Security HTTP Headers Middleware (Level 7)
// Enforces X-Content-Type-Options, X-Frame-Options, HSTS, strips X-Powered-By
app.use(securityHeaders);

// 2. Secure CORS Configuration (Level 7)
// Enforces explicit origin whitelisting, restricted methods, specific headers, and handles preflight OPTIONS
app.use(secureCors);

// 3. Cookie Parsing Middleware (Level 8)
// Parses incoming HTTP cookies for secure HttpOnly session tokens
app.use(cookieParser());

// 4. General API Rate Limiting (Level 7)
// Limits requests to 120 req/min per IP to mitigate DoS and API flooding
app.use('/api/', generalRateLimiter);

// 5. Built-in Body Parsing Middleware with Strict Payload Size Limits (Level 6 & 7)
// Limits payload size to 50KB to protect against Memory Exhaustion & Oversized Input DoS
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// 6. Input Sanitization Middleware (Level 6 & 7)
// Strips dangerous HTML tags (<script>, <iframe>), removes javascript: URIs,
// neutralizes event handlers, and blocks NoSQL query injection keys starting with '$'
app.use(sanitizeInput);

// 7. Secure Request Logging Middleware (Level 7)
// Logs traffic while strictly redacting passwords, tokens, API keys, and authorization headers
app.use(secureLogger);

// 5. Health & Database Status Routes
app.get('/api/health', (req, res) => {
  const db = getDbStatus();
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'Student Complaint & Service Management Backend',
    version: '2.0.0 (Level 6 - Input Security & Attack Hardening)',
    database: {
      connected: db.connected,
      configured: db.configured,
      provider: db.provider,
    },
  });
});

app.get('/api/health/db', (req, res) => {
  const db = getDbStatus();
  // Never expose passwords, connection strings, or usernames
  res.status(db.connected ? 200 : 200).json({
    success: true,
    database: {
      connected: db.connected,
      configured: db.configured,
      provider: db.provider,
      mode: db.connected ? 'Active PostgreSQL (Supabase)' : 'In-Memory Fallback Mode',
      hint: db.configured 
        ? (db.connected ? 'Connected to PostgreSQL.' : 'Connection attempted; check credentials in .env')
        : 'To connect Supabase, define DATABASE_URL in your .env file.',
    },
  });
});

// 6. Level 6 Security Audit Inspection Endpoint
// Allows students, teachers, and security testers to inspect payload sanitization in real time
app.post('/api/security/audit-inspect', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Payload successfully received, parsed, and sanitized through Level 6 security pipeline.',
    receivedSanitizedBody: req.body,
    payloadSizeBytes: JSON.stringify(req.body).length,
    timestamp: new Date().toISOString(),
  });
});

// 7. Mount Domain Feature Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintsRoutes);

// Export Express app (error handlers can be attached or deferred for SPA fallback)
export default app;
export { notFoundHandler, globalErrorHandler };
