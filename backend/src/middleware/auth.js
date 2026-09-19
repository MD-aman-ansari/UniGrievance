/**
 * Authentication Middleware
 * 
 * Level 4: Protects private routes by verifying JWT Bearer tokens.
 * 
 * Flow:
 * React Request (Headers: { Authorization: "Bearer <token>" })
 *   → authenticate middleware
 *   → parse & verify token signature with JWT_SECRET
 *   → extract user claims
 *   → attach to req.user
 *   → pass control to next()
 */

import jwt from 'jsonwebtoken';
import { authConfig } from '../config/index.js';
import { SESSION_COOKIE_NAME, isSessionRevoked } from '../services/sessionService.js';

export const authenticate = (req, res, next) => {
  // 1. Extract token from either Secure HttpOnly Cookie or Authorization header
  let token = null;

  if (req.cookies && req.cookies[SESSION_COOKIE_NAME]) {
    token = req.cookies[SESSION_COOKIE_NAME];
  } else if (req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    } else {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Malformed authorization header. Format must be: Bearer <token>',
      });
    }
  }

  // 2. Reject if no token found in cookie or header
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Access denied. No session cookie or authorization header provided. Please log in.',
    });
  }

  // 3. Level 8: Check server-side Session Invalidation / Revocation list
  if (isSessionRevoked(token)) {
    return res.status(401).json({
      success: false,
      error: 'Session Revoked',
      message: 'This session has been terminated / logged out. Please log in again.',
    });
  }

  // 4. Verify token signature and expiration
  try {
    const decoded = jwt.verify(token, authConfig.jwtSecret);
    // Attach decoded user information to the request object
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };
    req.token = token;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Session Expired',
        message: 'Your session has expired. Please log in again.',
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid Token',
      message: 'Invalid or forged authentication token. Access denied.',
    });
  }
};

/**
 * Optional Authentication Middleware
 * If a token is provided, decodes it into req.user; if not, allows the request to continue.
 * Useful for public endpoints that provide enhanced info for logged-in users.
 */
export const optionalAuthenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, authConfig.jwtSecret);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };
  } catch {
    // If optional token is invalid, continue as unauthenticated guest
  }
  next();
};

/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * Level 5: Restricts route execution based on user role (e.g., 'admin' or 'student').
 * 
 * Authentication verifies WHO the user is.
 * Authorization verifies WHAT the user is permitted to do.
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // 1. Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required. Please provide a valid Bearer token.',
      });
    }

    // 2. Check if user's role is in the allowed list
    const userRole = req.user.role ? req.user.role.toLowerCase() : '';
    const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Access denied. Insufficient permissions. Required role: [${allowedRoles.join(', ')}]. Your current role is "${req.user.role}".`,
      });
    }

    next();
  };
};

// Convenient alias
export const requireRole = authorizeRoles;

