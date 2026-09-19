/**
 * Authentication Service
 * 
 * Level 4: Secure User Authentication & Password Hashing
 * 
 * Implements:
 * - Registration with bcrypt password hashing (10 salt rounds)
 * - Login with timing-safe bcrypt password comparison
 * - JWT Token generation
 * - Protection against exposing password hashes
 * - Dual-mode persistence: PostgreSQL (Supabase) + In-memory fallback
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authConfig } from '../config/index.js';
import { pool, isConnected } from '../config/db.js';

// Pre-seeded users for in-memory mode
// Demonstrates realistic credentials with real bcrypt hashes
const DEMO_STUDENT_HASH = bcrypt.hashSync('student123', authConfig.bcryptSaltRounds);
const DEMO_ADMIN_HASH = bcrypt.hashSync('admin123', authConfig.bcryptSaltRounds);

let inMemoryUsers = [
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Alex Rivera',
    email: 'alex.rivera@campus.edu',
    password_hash: DEMO_STUDENT_HASH,
    role: 'student',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'usr_student_202',
    name: 'Maria Chen',
    email: 'm.chen@campus.edu',
    password_hash: DEMO_STUDENT_HASH,
    role: 'student',
    createdAt: '2026-09-02T08:00:00.000Z',
  },
  {
    id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    name: 'Dr. Eleanor Vance',
    email: 'e.vance@campus.edu',
    password_hash: DEMO_ADMIN_HASH,
    role: 'admin',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
];

/**
 * Generate a cryptographically signed JWT access token.
 * Contains non-sensitive identity claims: id, email, role, name.
 */
export const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  return jwt.sign(payload, authConfig.jwtSecret, {
    expiresIn: authConfig.jwtExpiresIn,
  });
};

/**
 * Register a new user
 * 
 * Steps:
 * 1. Normalize email to lowercase
 * 2. Verify email is not already taken (prevent duplicate accounts)
 * 3. Hash plain-text password using bcrypt (one-way salt + hash)
 * 4. Store user in database / in-memory store
 * 5. Return sanitized user profile + JWT token (NEVER return password_hash!)
 */
export const registerUser = async ({ name, email, password, role = 'student' }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();

  // 1. PostgreSQL mode
  if (pool && isConnected) {
    try {
      // Check for duplicate email
      const checkExisting = await pool.query(
        'SELECT id FROM users WHERE LOWER(email) = $1',
        [normalizedEmail]
      );

      if (checkExisting.rows.length > 0) {
        const error = new Error(`An account with email "${normalizedEmail}" already exists.`);
        error.statusCode = 409; // 409 Conflict
        throw error;
      }

      // Hash password using bcrypt
      const passwordHash = await bcrypt.hash(password, authConfig.bcryptSaltRounds);

      // Insert new user record
      const insertQuery = `
        INSERT INTO users (name, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, email, role, created_at as "createdAt"
      `;
      const res = await pool.query(insertQuery, [
        trimmedName,
        normalizedEmail,
        passwordHash,
        role === 'admin' ? 'admin' : 'student',
      ]);

      const newUser = res.rows[0];
      const token = generateToken(newUser);

      return {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          createdAt: newUser.createdAt,
        },
        token,
      };
    } catch (err) {
      if (err.statusCode) throw err;
      console.warn('[DB Error in registerUser, falling back to memory]:', err.message);
    }
  }

  // 2. In-Memory fallback mode
  const existing = inMemoryUsers.find(
    (u) => u.email.toLowerCase() === normalizedEmail
  );

  if (existing) {
    const error = new Error(`An account with email "${normalizedEmail}" already exists.`);
    error.statusCode = 409; // 409 Conflict
    throw error;
  }

  // Hash password using bcrypt
  const passwordHash = await bcrypt.hash(password, authConfig.bcryptSaltRounds);
  const now = new Date().toISOString();

  const newUser = {
    id: `usr_${Date.now()}`,
    name: trimmedName,
    email: normalizedEmail,
    password_hash: passwordHash,
    role: role === 'admin' ? 'admin' : 'student',
    createdAt: now,
  };

  inMemoryUsers.push(newUser);

  const token = generateToken(newUser);

  // SANITIZATION: Never send password_hash back to client!
  return {
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt,
    },
    token,
  };
};

/**
 * Authenticate user credentials & create session token
 * 
 * Steps:
 * 1. Find user by normalized email
 * 2. If not found, return generic "Invalid email or password" (prevents user enumeration)
 * 3. Compare candidate password against stored bcrypt hash using bcrypt.compare()
 * 4. If invalid, return generic error
 * 5. If valid, issue JWT token and sanitized user profile
 */
export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. PostgreSQL mode
  if (pool && isConnected) {
    try {
      const res = await pool.query(
        `SELECT id, name, email, role, password_hash, created_at as "createdAt" FROM users WHERE LOWER(email) = $1`,
        [normalizedEmail]
      );

      if (res.rows.length === 0) {
        const error = new Error('Invalid email or password.');
        error.statusCode = 401; // 401 Unauthorized
        throw error;
      }

      const user = res.rows[0];

      // Compare passwords safely using bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        const error = new Error('Invalid email or password.');
        error.statusCode = 401; // 401 Unauthorized
        throw error;
      }

      const token = generateToken(user);

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
        token,
      };
    } catch (err) {
      if (err.statusCode) throw err;
      console.warn('[DB Error in loginUser, falling back to memory]:', err.message);
    }
  }

  // 2. In-Memory fallback mode
  const user = inMemoryUsers.find(
    (u) => u.email.toLowerCase() === normalizedEmail
  );

  if (!user) {
    // Deliberately identical error message to prevent username enumeration attacks
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
    token,
  };
};

/**
 * Retrieve user by primary key (UUID / string ID)
 * Used by authentication middleware to populate req.user
 */
export const getUserById = async (id) => {
  if (pool && isConnected) {
    try {
      const res = await pool.query(
        'SELECT id, name, email, role, created_at as "createdAt" FROM users WHERE id::text = $1',
        [id]
      );
      if (res.rows.length > 0) {
        return res.rows[0];
      }
    } catch (err) {
      console.warn('[DB Error in getUserById, falling back to memory]:', err.message);
    }
  }

  const user = inMemoryUsers.find((u) => u.id === id);
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
};
