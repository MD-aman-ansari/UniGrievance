/**
 * Backend Configuration Module
 * Defines configuration constants, allowed enum values, and defaults.
 */

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: '/api',
};

export const authConfig = {
  jwtSecret: process.env.JWT_SECRET || 'dev-super-secret-jwt-key-student-management-system-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bcryptSaltRounds: 10,
};

// Allowed values matching business domain requirements
export const ALLOWED_STATUSES = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

export const ALLOWED_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const ALLOWED_CATEGORIES = [
  'Hostel & Housing',
  'Academic & Courses',
  'IT & Labs',
  'Library Services',
  'Cafeteria & Hygiene',
  'Campus Infrastructure',
  'Fees & Accounts',
];

// Department mapping for automatic triage
export const CATEGORY_DEPARTMENT_MAP = {
  'Hostel & Housing': 'Civil & Hostel Maintenance',
  'Academic & Courses': 'Academic Registrar & Deans Office',
  'IT & Labs': 'IT Support & Audiovisual',
  'Library Services': 'Library & Learning Resources',
  'Cafeteria & Hygiene': 'Campus Health & Dining Services',
  'Campus Infrastructure': 'HVAC & Physical Plant',
  'Fees & Accounts': 'Finance & Student Accounts',
};
