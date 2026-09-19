/**
 * Authentication Controller
 * 
 * Level 4: Manages HTTP requests and responses for user authentication.
 * 
 * Responsibilities:
 * - Extracts inputs from req.body
 * - Calls authService methods
 * - Sets appropriate HTTP status codes (200, 201, 400, 401, 409)
 * - Returns sanitized JSON responses (never exposes password or hash!)
 */

import * as authService from '../services/authService.js';
import { 
  SESSION_COOKIE_NAME, 
  getSecureCookieOptions, 
  invalidateSession 
} from '../services/sessionService.js';

/**
 * POST /api/auth/register
 * Creates a new user with hashed password and generates a JWT.
 * Level 8: Sets secure HttpOnly, SameSite cookie in addition to token response.
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const result = await authService.registerUser({
      name,
      email,
      password,
      role: role || 'student',
    });

    // Level 8: Set secure HttpOnly session cookie
    res.cookie(SESSION_COOKIE_NAME, result.token, getSecureCookieOptions());

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (error) {
    if (error.statusCode === 409) {
      return res.status(409).json({
        success: false,
        error: 'Duplicate Email',
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Verifies email & password; returns JWT token and sets secure session cookie on success.
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await authService.loginUser({ email, password });

    // Level 8: Issue secure HttpOnly, SameSite, Secure cookie
    res.cookie(SESSION_COOKIE_NAME, result.token, getSecureCookieOptions());

    return res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (error) {
    if (error.statusCode === 401) {
      return res.status(401).json({
        success: false,
        error: 'Authentication Failed',
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Level 8: Clears secure session cookie AND invalidates the token in the server-side revocation list.
 */
export const logout = (req, res) => {
  // Extract token from cookie or Authorization header for server-side revocation
  const cookieToken = req.cookies?.[SESSION_COOKIE_NAME];
  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const tokenToRevoke = cookieToken || headerToken;

  if (tokenToRevoke) {
    invalidateSession(tokenToRevoke);
  }

  // Clear cookie with identical path and security flags
  const cookieOptions = getSecureCookieOptions();
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: cookieOptions.httpOnly,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    path: cookieOptions.path,
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully. Session cookie cleared and server-side token invalidated.',
  });
};

/**
 * GET /api/auth/me
 * Protected route: returns current authenticated user profile extracted from JWT.
 */
export const getProfile = async (req, res, next) => {
  try {
    // req.user was populated by authenticate middleware
    const user = await authService.getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User Not Found',
        message: 'The user associated with this token no longer exists.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
