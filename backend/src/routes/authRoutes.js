/**
 * Authentication Routes
 * 
 * Level 4: Endpoint mappings for authentication lifecycle.
 * 
 * POST /api/auth/register  -> validateRegister -> authController.register
 * POST /api/auth/login     -> validateLogin    -> authController.login
 * POST /api/auth/logout    -> authController.logout
 * GET  /api/auth/me        -> authenticate     -> authController.getProfile
 */

import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { validateRegister, validateLogin } from '../middleware/validator.js';
import { authenticate } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public routes (Level 7: Rate-limited to prevent brute-force attacks and credential stuffing)
router.post('/send-otp', authRateLimiter, authController.sendOtp);
router.post('/verify-otp', authRateLimiter, authController.verifyOtp);
router.post('/register', authRateLimiter, validateRegister, authController.register);
router.post('/login', authRateLimiter, validateLogin, authController.login);
router.post('/logout', authController.logout);

// Protected routes (requires Bearer token)
router.get('/me', authenticate, authController.getProfile);

export default router;
