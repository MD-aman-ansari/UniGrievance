/**
 * Input Validation Middleware
 * 
 * Validates request data before passing control to the controller.
 * 
 * WHY BACKEND VALIDATION IS ESSENTIAL:
 * Client-side validation (in React/HTML) provides a good user experience,
 * but it provides ZERO security. Anyone using curl, Postman, or browser dev tools
 * can bypass frontend forms entirely and send arbitrary or malicious payloads directly
 * to our Express API. Therefore, the backend must ALWAYS be the authoritative validator.
 */

import { ALLOWED_CATEGORIES, ALLOWED_PRIORITIES, ALLOWED_STATUSES } from '../config/index.js';

/**
 * Validates payload for POST /api/complaints
 */
export const validateCreateComplaint = (req, res, next) => {
  const { title, category, description, priority, location } = req.body;
  const errors = [];

  // 1. Title validation
  if (title === undefined || title === null) {
    errors.push('Title is required.');
  } else if (typeof title !== 'string') {
    errors.push(`Invalid data type for "title". Expected string, received ${typeof title}.`);
  } else if (title.trim().length === 0) {
    errors.push('Title cannot be empty or whitespace only.');
  } else if (title.trim().length < 5) {
    errors.push('Title must be at least 5 characters long.');
  } else if (title.trim().length > 120) {
    errors.push('Title cannot exceed 120 characters (oversized input blocked).');
  }

  // 2. Category validation
  if (category === undefined || category === null) {
    errors.push(`Category is required. Allowed options: ${ALLOWED_CATEGORIES.join(', ')}`);
  } else if (typeof category !== 'string') {
    errors.push(`Invalid data type for "category". Expected string, received ${typeof category}.`);
  } else if (!ALLOWED_CATEGORIES.includes(category.trim())) {
    errors.push(`Invalid category "${category}". Allowed options: ${ALLOWED_CATEGORIES.join(', ')}`);
  }

  // 3. Description validation
  if (description === undefined || description === null) {
    errors.push('Description is required.');
  } else if (typeof description !== 'string') {
    errors.push(`Invalid data type for "description". Expected string, received ${typeof description}.`);
  } else if (description.trim().length === 0) {
    errors.push('Description cannot be empty.');
  } else if (description.trim().length < 15) {
    errors.push('Description must provide sufficient detail (at least 15 characters).');
  } else if (description.trim().length > 2000) {
    errors.push('Description cannot exceed 2000 characters (oversized input blocked).');
  }

  // 4. Priority validation (optional in payload, defaults to MEDIUM if omitted)
  if (priority !== undefined) {
    if (typeof priority !== 'string') {
      errors.push(`Invalid data type for "priority". Expected string, received ${typeof priority}.`);
    } else if (!ALLOWED_PRIORITIES.includes(priority.toUpperCase())) {
      errors.push(`Priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}`);
    }
  }

  // 5. Location validation
  if (location === undefined || location === null) {
    errors.push('Specific campus location or room number is required.');
  } else if (typeof location !== 'string') {
    errors.push(`Invalid data type for "location". Expected string, received ${typeof location}.`);
  } else if (location.trim().length === 0) {
    errors.push('Location cannot be empty or whitespace only.');
  } else if (location.trim().length < 3) {
    errors.push('Location must be at least 3 characters.');
  } else if (location.trim().length > 150) {
    errors.push('Location cannot exceed 150 characters.');
  }

  // If any errors were detected, halt request and respond with 400 Bad Request
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Failed',
      message: 'One or more submitted fields failed validation.',
      errors,
    });
  }

  // Normalize priority to uppercase
  if (req.body.priority) {
    req.body.priority = req.body.priority.toUpperCase();
  }

  next();
};

/**
 * Validates payload for PUT /api/complaints/:id
 */
export const validateUpdateComplaint = (req, res, next) => {
  const { status, priority, category, title, description, location, adminComment, adminNote, resolutionNotes } = req.body;
  const errors = [];

  // Check that at least one field to update is provided
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Empty Update Payload',
      message: 'Please provide at least one field to update.',
    });
  }

  // Validate status if present
  if (status !== undefined) {
    if (typeof status !== 'string') {
      errors.push(`Invalid data type for "status". Expected string, received ${typeof status}.`);
    } else if (!ALLOWED_STATUSES.includes(status.toUpperCase())) {
      errors.push(`Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}`);
    } else {
      req.body.status = status.toUpperCase();
    }
  }

  // Validate priority if present
  if (priority !== undefined) {
    if (typeof priority !== 'string') {
      errors.push(`Invalid data type for "priority". Expected string, received ${typeof priority}.`);
    } else if (!ALLOWED_PRIORITIES.includes(priority.toUpperCase())) {
      errors.push(`Invalid priority. Allowed values: ${ALLOWED_PRIORITIES.join(', ')}`);
    } else {
      req.body.priority = priority.toUpperCase();
    }
  }

  // Validate category if present
  if (category !== undefined) {
    if (typeof category !== 'string') {
      errors.push(`Invalid data type for "category". Expected string, received ${typeof category}.`);
    } else if (!ALLOWED_CATEGORIES.includes(category)) {
      errors.push(`Invalid category. Allowed values: ${ALLOWED_CATEGORIES.join(', ')}`);
    }
  }

  // Validate title if present
  if (title !== undefined) {
    if (typeof title !== 'string') {
      errors.push(`Invalid data type for "title". Expected string, received ${typeof title}.`);
    } else if (title.trim().length < 5) {
      errors.push('Title must be at least 5 characters long.');
    } else if (title.trim().length > 120) {
      errors.push('Title cannot exceed 120 characters.');
    }
  }

  // Validate description if present
  if (description !== undefined) {
    if (typeof description !== 'string') {
      errors.push(`Invalid data type for "description". Expected string, received ${typeof description}.`);
    } else if (description.trim().length < 15) {
      errors.push('Description must be at least 15 characters long.');
    } else if (description.trim().length > 2000) {
      errors.push('Description cannot exceed 2000 characters.');
    }
  }

  // Validate location if present
  if (location !== undefined) {
    if (typeof location !== 'string') {
      errors.push(`Invalid data type for "location". Expected string, received ${typeof location}.`);
    } else if (location.trim().length < 3) {
      errors.push('Location must be at least 3 characters long.');
    } else if (location.trim().length > 150) {
      errors.push('Location cannot exceed 150 characters.');
    }
  }

  // Validate resolution / admin notes if present
  const notes = adminComment || adminNote || resolutionNotes;
  if (notes !== undefined) {
    if (typeof notes !== 'string') {
      errors.push(`Invalid data type for resolution notes. Expected string, received ${typeof notes}.`);
    } else if (notes.length > 2000) {
      errors.push('Resolution notes cannot exceed 2000 characters.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Failed',
      message: 'Update payload failed validation checks.',
      errors,
    });
  }

  next();
};

/**
 * Validates payload for POST /api/complaints/:id/comments
 * Level 6: Enforces type safety, prevents oversized strings, and blocks empty inputs.
 */
export const validateAddComment = (req, res, next) => {
  const { message } = req.body;
  const errors = [];

  if (message === undefined || message === null) {
    errors.push('Comment message is required.');
  } else if (typeof message !== 'string') {
    errors.push(`Invalid data type for "message". Expected string, received ${typeof message}.`);
  } else if (message.trim().length === 0) {
    errors.push('Comment message cannot be empty or whitespace only.');
  } else if (message.trim().length < 2) {
    errors.push('Comment message must be at least 2 characters long.');
  } else if (message.length > 1000) {
    errors.push('Comment message cannot exceed 1000 characters (oversized input blocked).');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Failed',
      message: 'Comment failed validation checks.',
      errors,
    });
  }

  next();
};

/**
 * Validates payload for POST /api/auth/register
 */
export const validateRegister = (req, res, next) => {
  const { name, email, password, role } = req.body;
  const errors = [];

  // 1. Name validation
  if (name === undefined || name === null) {
    errors.push('Full name is required.');
  } else if (typeof name !== 'string') {
    errors.push(`Invalid data type for "name". Expected string, received ${typeof name}.`);
  } else if (name.trim().length === 0) {
    errors.push('Full name cannot be empty.');
  } else if (name.trim().length < 2) {
    errors.push('Full name must be at least 2 characters long.');
  } else if (name.trim().length > 100) {
    errors.push('Full name cannot exceed 100 characters.');
  }

  // 2. Email verification (Gmail format)
  const gmailRegex = /^[a-z0-9][a-z0-9._-]*@gmail\.com$/i;

  if (email === undefined || email === null) {
    errors.push('Email address is required.');
  } else if (typeof email !== 'string') {
    errors.push(`Invalid data type for "email". Expected string, received ${typeof email}.`);
  } else {
    const cleanEmail = email.trim();

    if (cleanEmail.length === 0) {
      errors.push('Email address cannot be empty.');
    } else if (cleanEmail.length > 254) {
      errors.push('Email address cannot exceed 254 characters.');
    } else if (/\s/.test(cleanEmail)) {
      errors.push('Email address must not contain spaces.');
    } else if (!gmailRegex.test(cleanEmail)) {
      errors.push('Invalid email. Use a Gmail address such as student123@gmail.com.');
    } else if (cleanEmail.includes('..')) {
      errors.push('Email address cannot contain consecutive dots.');
    } else if (cleanEmail.includes('__')) {
      errors.push('Email address cannot contain consecutive underscores.');
    } else if (cleanEmail.includes('--')) {
      errors.push('Email address cannot contain consecutive hyphens.');
    } else {
      // Normalize email for downstream handlers
      req.body.email = cleanEmail.toLowerCase();
    }
  }

  // 3. Password security policy
  // Requirements: at least 8 characters, one capital letter, numeric value, and one special character
  if (password === undefined || password === null) {
    errors.push('Password is required.');
  } else if (typeof password !== 'string') {
    errors.push(`Invalid data type for "password". Expected string, received ${typeof password}.`);
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long.');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one capital letter (A-Z).');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one numeric digit (0-9).');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character (e.g., !@#$%^&*).');
    }
    if (password.length > 72) {
      // Bcrypt max length limit is 72 bytes; rejecting longer strings prevents DoS
      errors.push('Password cannot exceed 72 characters (preventing bcrypt CPU DoS).');
    }
  }

  // 4. Role validation (optional, defaults to 'student')
  if (role !== undefined) {
    if (typeof role !== 'string') {
      errors.push(`Invalid data type for "role". Expected string, received ${typeof role}.`);
    } else if (!['student', 'admin'].includes(role)) {
      errors.push('Role must be either "student" or "admin".');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Failed',
      message: 'Registration inputs failed validation checks.',
      errors,
    });
  }

  next();
};

/**
 * Validates payload for POST /api/auth/login
 */
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];
  const strictEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (email === undefined || email === null) {
    errors.push('Email is required.');
  } else if (typeof email !== 'string') {
    errors.push(`Invalid data type for "email". Expected string, received ${typeof email}.`);
  } else if (email.trim().length === 0) {
    errors.push('Email cannot be empty.');
  } else if (!strictEmailRegex.test(email.trim()) || email.includes('..')) {
    errors.push('Email failed verification. Please enter a valid email format.');
  }

  if (password === undefined || password === null) {
    errors.push('Password is required.');
  } else if (typeof password !== 'string') {
    errors.push(`Invalid data type for "password". Expected string, received ${typeof password}.`);
  } else if (password.length === 0) {
    errors.push('Password cannot be empty.');
  } else if (password.length > 72) {
    errors.push('Password cannot exceed 72 characters.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Failed',
      message: 'Login credentials missing or invalid.',
      errors,
    });
  }

  next();
};

