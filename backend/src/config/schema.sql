-- ==============================================================================
-- Student Complaint & Service Management System
-- Database Schema for PostgreSQL / Supabase
-- ==============================================================================

-- 1. Enable UUID generation functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean up existing tables if re-running migration (drop in reverse dependency order)
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ==============================================================================
-- TABLE 1: users
-- Represents students and campus administrators
-- ==============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_user_role CHECK (role IN ('student', 'admin'))
);

-- Index to quickly look up users by email (already enforced uniquely, but explicitly indexed)
CREATE INDEX idx_users_email ON users(email);


-- ==============================================================================
-- TABLE 2: complaints
-- Represents grievance tickets filed by students
-- ==============================================================================
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Foreign Key: Links complaint to the student who lodged it
    -- ON DELETE CASCADE: If a student's record is removed, their tickets are cleanly pruned
    CONSTRAINT fk_complaints_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,

    -- Constraints on domain values
    CONSTRAINT chk_complaint_status 
        CHECK (status IN ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED')),
    CONSTRAINT chk_complaint_title_length 
        CHECK (char_length(trim(title)) >= 5)
);

-- Performance Indexes on Complaints
-- 1. Filter tickets submitted by a specific student (Dashboard: "My Complaints")
CREATE INDEX idx_complaints_user_id ON complaints(user_id);

-- 2. Filter tickets by status (Admin Dashboard: "Show only PENDING or RESOLVED")
CREATE INDEX idx_complaints_status ON complaints(status);

-- 3. Sort tickets chronologically (latest first)
CREATE INDEX idx_complaints_created_at ON complaints(created_at DESC);


-- ==============================================================================
-- TABLE 3: comments
-- Represents audit trail, technician updates, and dialogue on a complaint
-- ==============================================================================
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL,
    user_id UUID NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Foreign Keys
    -- 1. Links comment to the specific complaint ticket
    CONSTRAINT fk_comments_complaint 
        FOREIGN KEY (complaint_id) 
        REFERENCES complaints(id) 
        ON DELETE CASCADE,

    -- 2. Links comment to the author (student or admin)
    CONSTRAINT fk_comments_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- Performance Indexes on Comments
-- Fast retrieval of all comments / audit history for a specific ticket
CREATE INDEX idx_comments_complaint_id ON comments(complaint_id);
CREATE INDEX idx_comments_created_at ON comments(created_at ASC);


-- ==============================================================================
-- AUTOMATIC TIMESTAMP TRIGGER
-- Automatically updates updated_at whenever a complaint row is modified
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_complaints_updated_at
BEFORE UPDATE ON complaints
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();


-- ==============================================================================
-- SEED INITIAL DATA (For testing queries)
-- ==============================================================================
-- Insert Demo Users
INSERT INTO users (id, name, email, password_hash, role)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Alex Rivera', 'alex.rivera@campus.edu', '$2b$10$placeholderhashforstudent101', 'student'),
    ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Dr. Eleanor Vance', 'e.vance@campus.edu', '$2b$10$placeholderhashforadmin001', 'admin');

-- Insert Initial Complaint
INSERT INTO complaints (id, user_id, title, description, category, status)
VALUES 
    (
        'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'Water leakage in Block B 3rd Floor Washroom',
        'Continuous leaking tap and standing water creating a slip hazard near Room 312. Maintenance notified informally two days ago but not fixed.',
        'Hostel & Housing',
        'IN_PROGRESS'
    );

-- Insert Initial Comment / Audit event
INSERT INTO comments (complaint_id, user_id, message)
VALUES 
    (
        'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
        'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        'Assigned to Civil & Hostel Maintenance team. Plumber on site.'
    );
