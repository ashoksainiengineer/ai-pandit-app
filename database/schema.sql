-- ==========================================
-- AI-PANDIT BIRTH TIME RECTIFICATION DATABASE SCHEMA
-- Turso SQLite Database Schema
-- Version: 2.2
-- Author: Your Senior Dev
-- Change Log:
-- v2.2: Made marital_status mandatory and added custom time uncertainty field.
-- v2.1: Modified time_slot_candidates to link to rectification_requests for real-time streaming.
-- ==========================================

-- Drop tables in reverse order of creation to avoid foreign key constraint errors
DROP VIEW IF EXISTS user_rectification_summary;
DROP TABLE IF EXISTS advanced_verifications;
DROP TABLE IF EXISTS dasha_periods;
DROP TABLE IF EXISTS time_slot_candidates;
DROP TABLE IF EXISTS rectification_results;
DROP TABLE IF EXISTS life_events;
DROP TABLE IF EXISTS physical_descriptions;
DROP TABLE IF EXISTS birth_data;
DROP TABLE IF EXISTS rectification_requests;
DROP TABLE IF EXISTS users;

-- ==========================================
-- 1. USERS TABLE (Clerk Integration)
-- Stores user information synced from Clerk
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,                      -- Clerk userId (e.g., user_2agWd99...)
    clerk_id TEXT UNIQUE NOT NULL,            -- Clerk's unique identifier
    email TEXT UNIQUE NOT NULL,               -- User's primary email, kept in sync
    full_name TEXT,                           -- User's full name
    profile_image_url TEXT,                   -- URL for user's profile picture
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Timestamp of when the user was first created in our db
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP  -- Timestamp of the last update
);

-- ==========================================
-- 2. RECTIFICATION REQUESTS TABLE
-- A central table to track each analysis request made by a user.
-- ==========================================
CREATE TABLE IF NOT EXISTS rectification_requests (
    id TEXT PRIMARY KEY,                      -- Unique ID for the request (UUID)
    user_id TEXT NOT NULL,                    -- Foreign key to the users table
    status TEXT NOT NULL CHECK(status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- ==========================================
-- 3. BIRTH DATA TABLE
-- Stores the initial birth information provided by the user for a request.
-- ==========================================
CREATE TABLE IF NOT EXISTS birth_data (
    id TEXT PRIMARY KEY,                      -- Unique ID for this birth data entry (UUID)
    request_id TEXT UNIQUE NOT NULL,          -- Each request has one set of birth data
    full_name TEXT NOT NULL,
    date_of_birth TEXT NOT NULL,              -- Stored as 'YYYY-MM-DD'
    tentative_time TEXT NOT NULL,             -- Stored as 'HH:MM:SS'
    time_uncertainty TEXT NOT NULL,           -- e.g., 'exact', '5min', 'custom_range'
    time_uncertainty_custom_minutes INTEGER,  -- Stores custom uncertainty value in minutes if selected
    birth_place TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    timezone TEXT NOT NULL,
    gender TEXT NOT NULL CHECK(gender IN ('male', 'female', 'other')),
    marital_status TEXT NOT NULL CHECK(marital_status IN ('unmarried', 'married')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES rectification_requests (id) ON DELETE CASCADE
);

-- ==========================================
-- 4. PHYSICAL DESCRIPTIONS TABLE
-- Stores the physical traits provided by the user.
-- ==========================================
CREATE TABLE IF NOT EXISTS physical_descriptions (
    id TEXT PRIMARY KEY,
    request_id TEXT UNIQUE NOT NULL,
    body_structure TEXT,
    height TEXT,
    face_shape TEXT,
    complexion TEXT,
    distinctive_features TEXT,                -- Any unique marks or features
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES rectification_requests (id) ON DELETE CASCADE
);

-- ==========================================
-- 5. LIFE EVENTS TABLE
-- Stores significant life events provided by the user.
-- ==========================================
CREATE TABLE IF NOT EXISTS life_events (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL,
    event_type TEXT NOT NULL,                 -- e.g., 'Marriage', 'First Child', 'Career Start'
    event_date TEXT NOT NULL,                 -- 'YYYY-MM-DD'
    event_details TEXT,                       -- Additional notes about the event
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES rectification_requests (id) ON DELETE CASCADE
);

-- ==========================================
-- 6. RECTIFICATION RESULTS TABLE
-- Stores the final output of the analysis.
-- ==========================================
CREATE TABLE IF NOT EXISTS rectification_results (
    id TEXT PRIMARY KEY,
    request_id TEXT UNIQUE NOT NULL,
    rectified_birth_time TEXT NOT NULL,       -- The final, calculated birth time 'YYYY-MM-DDTHH:MM:SSZ'
    confidence_score REAL NOT NULL,           -- The overall confidence score (0-100)
    ascendant_sign TEXT NOT NULL,             -- The calculated rising sign (Lagna)
    moon_sign TEXT NOT NULL,
    sun_sign TEXT NOT NULL,
    ai_summary_report TEXT NOT NULL,          -- The detailed textual summary from the AI
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES rectification_requests (id) ON DELETE CASCADE
);

-- ==========================================
-- 7. TIME SLOT CANDIDATES TABLE (MODIFIED FOR REAL-TIME)
-- Stores each evaluated time slot during the rectification process for traceability.
-- ==========================================
CREATE TABLE IF NOT EXISTS time_slot_candidates (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL,                 -- LINKED TO REQUESTS for real-time streaming
    time_slot TEXT NOT NULL,                  -- The specific time evaluated 'HH:MM:SS'
    ascendant_at_slot TEXT NOT NULL,
    score REAL NOT NULL,                      -- Score for this individual time slot
    rank INTEGER,                             -- Live rank of the candidate, can be updated during processing
    evaluation_notes TEXT,                    -- AI notes on why this slot was scored as it was (JSON)
    is_best_candidate INTEGER NOT NULL DEFAULT 0, -- 1 for true, 0 for false
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES rectification_requests (id) ON DELETE CASCADE
);

-- ==========================================
-- 8. DASHA PERIODS TABLE
-- Stores the relevant Dasha (planetary period) calculations for the final time.
-- ==========================================
CREATE TABLE IF NOT EXISTS dasha_periods (
    id TEXT PRIMARY KEY,
    result_id TEXT NOT NULL,
    event_id TEXT,                            -- Optional: link to a specific life event
    dasha_system TEXT NOT NULL DEFAULT 'Vimshottari', -- The system used (e.g., Vimshottari)
    major_lord TEXT NOT NULL,                 -- e.g., 'Saturn'
    sub_lord TEXT NOT NULL,                   -- e.g., 'Venus'
    sub_sub_lord TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    is_active_during_event INTEGER,           -- Was this Dasha active during a key event?
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (result_id) REFERENCES rectification_results (id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES life_events (id) ON DELETE SET NULL
);

-- ==========================================
-- 9. ADVANCED VERIFICATIONS TABLE
-- Stores results from advanced astrological techniques for cross-verification.
-- ==========================================
CREATE TABLE IF NOT EXISTS advanced_verifications (
    id TEXT PRIMARY KEY,
    result_id TEXT NOT NULL,
    method_name TEXT NOT NULL CHECK(method_name IN ('Tattwa Shodhana', 'KP Verification', 'D60 Analysis')),
    is_consistent INTEGER NOT NULL,           -- 1 if consistent with the result, 0 otherwise
    details TEXT,                             -- JSON blob with detailed findings
    score_impact REAL,                        -- How much this verification contributed to the confidence score
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (result_id) REFERENCES rectification_results (id) ON DELETE CASCADE
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_requests_user_id ON rectification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_birth_data_request_id ON birth_data(request_id);
CREATE INDEX IF NOT EXISTS idx_life_events_request_id ON life_events(request_id);
CREATE INDEX IF NOT EXISTS idx_results_request_id ON rectification_results(request_id);
CREATE INDEX IF NOT EXISTS idx_candidates_request_id ON time_slot_candidates(request_id); -- Changed from result_id
CREATE INDEX IF NOT EXISTS idx_dasha_result_id ON dasha_periods(result_id);
CREATE INDEX IF NOT EXISTS idx_verifications_result_id ON advanced_verifications(result_id);

-- ==========================================
-- VIEW FOR EASY DATA ACCESS
-- Provides a summary of a user's latest rectification request and result.
-- ==========================================
CREATE VIEW IF NOT EXISTS user_rectification_summary AS
SELECT
    u.id as user_id,
    u.full_name,
    u.email,
    rr.id as request_id,
    rr.created_at as request_date,
    res.rectified_birth_time,
    res.confidence_score,
    res.ascendant_sign
FROM users u
JOIN rectification_requests rr ON u.id = rr.user_id
LEFT JOIN rectification_results res ON rr.id = res.request_id -- Changed to LEFT JOIN as results might not exist yet
ORDER BY rr.created_at DESC;

-- ==========================================
-- END OF SCHEMA
-- ==========================================

-- Comments for implementation:
-- 1. Run this schema in Turso: turso db shell your-db-name < schema.sql
-- 2. Your application logic should generate UUIDs for the primary keys (e.g., using a library like `uuid`).
-- 3. JSON data stored as TEXT should be parsed in your application layer (e.g., using `JSON.parse()` and `JSON.stringify()`).
-- 4. The `users` table should be populated/updated via Clerk webhooks to keep it in sync.
