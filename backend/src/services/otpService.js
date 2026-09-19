/**
 * OTP (One-Time Password) Verification Service
 * 
 * Provides cryptographically secure 6-digit numeric OTP generation,
 * time-based expiration (10 minutes), brute-force attempt throttling,
 * and email verification lifecycle management.
 */

import crypto from 'crypto';
import { sendOtpEmail } from './emailService.js';

// In-memory store for OTP records: email -> { otp, expiresAt, attempts, isVerified, verifiedAt, lastSentAt }
const otpStore = new Map();

// Periodic cleanup of expired records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, record] of otpStore.entries()) {
    if (now > record.expiresAt && (!record.isVerified || now - record.verifiedAt > 30 * 60 * 1000)) {
      otpStore.delete(email);
    }
  }
}, 5 * 60 * 1000);

/**
 * Generates and sends a 6-digit verification OTP to the target email.
 * @param {string} email
 * @returns {Promise<{ email: string, expiresInSeconds: number, otpPreview: string }>}
 */
export const generateAndSendOtp = async (email) => {
  const normalizedEmail = (email || '').trim().toLowerCase();

  // Rate limiting: allow new OTP only every 30 seconds per email
  const existingRecord = otpStore.get(normalizedEmail);
  const now = Date.now();
  if (existingRecord && existingRecord.lastSentAt && now - existingRecord.lastSentAt < 30 * 1000) {
    const waitSeconds = Math.ceil((30 * 1000 - (now - existingRecord.lastSentAt)) / 1000);
    const err = new Error(`Please wait ${waitSeconds}s before requesting a new verification code.`);
    err.statusCode = 429;
    throw err;
  }

  // Generate cryptographically secure 6-digit number between 100000 and 999999
  const otp = String(crypto.randomInt(100000, 1000000));
  const expiresInSeconds = 600; // 10 minutes
  const expiresAt = now + expiresInSeconds * 1000;

  otpStore.set(normalizedEmail, {
    otp,
    expiresAt,
    attempts: 0,
    isVerified: false,
    verifiedAt: null,
    lastSentAt: now,
  });

  // Send OTP to recipient via email transport (Gmail / SMTP)
  await sendOtpEmail({
    to: normalizedEmail,
    otp,
    expiresInMinutes: Math.round(expiresInSeconds / 60),
  });

  return {
    email: normalizedEmail,
    expiresInSeconds,
  };
};

/**
 * Validates a user-submitted OTP against the stored code.
 * @param {string} email
 * @param {string} otp
 * @returns {{ success: boolean, message: string }}
 */
export const verifyOtpCode = (email, otp) => {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const cleanOtp = String(otp || '').trim();

  const record = otpStore.get(normalizedEmail);

  if (!record) {
    const error = new Error('No verification request found for this email. Please request a new OTP code.');
    error.statusCode = 400;
    throw error;
  }

  // Check expiration
  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    const error = new Error('Verification code has expired. Please request a new OTP code.');
    error.statusCode = 400;
    throw error;
  }

  // Brute force protection: maximum 5 attempts
  if (record.attempts >= 5) {
    otpStore.delete(normalizedEmail);
    const error = new Error('Too many invalid attempts. For security, this OTP was invalidated. Please request a new one.');
    error.statusCode = 429;
    throw error;
  }

  // Compare OTP using constant-time buffer comparison to prevent timing attacks
  const cleanOtpBuf = Buffer.from(cleanOtp);
  const storedOtpBuf = Buffer.from(record.otp);

  const isMatch =
    cleanOtpBuf.length === storedOtpBuf.length &&
    crypto.timingSafeEqual(cleanOtpBuf, storedOtpBuf);

  if (!isMatch) {
    record.attempts += 1;
    const remainingAttempts = 5 - record.attempts;
    const error = new Error(
      `Incorrect verification code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`
    );
    error.statusCode = 400;
    throw error;
  }

  // Successfully verified
  record.isVerified = true;
  record.verifiedAt = Date.now();

  console.log(`[AUTH/OTP SERVICE] ✅ Email successfully verified: ${normalizedEmail}`);

  return {
    success: true,
    message: 'Email address successfully verified via OTP.',
  };
};

/**
 * Checks whether an email address has been verified via OTP within the last 30 minutes.
 * @param {string} email
 * @returns {boolean}
 */
export const isEmailVerified = (email) => {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const record = otpStore.get(normalizedEmail);

  if (!record || !record.isVerified || !record.verifiedAt) {
    return false;
  }

  // Valid for 30 minutes after verification
  return Date.now() - record.verifiedAt < 30 * 60 * 1000;
};

/**
 * Clears OTP state after successful user account creation.
 * @param {string} email
 */
export const consumeEmailVerification = (email) => {
  const normalizedEmail = (email || '').trim().toLowerCase();
  otpStore.delete(normalizedEmail);
};
