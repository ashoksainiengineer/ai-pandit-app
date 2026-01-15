-- ==========================================
-- AI-PANDIT BIRTH TIME RECTIFICATION DATABASE SCHEMA
-- Turso SQLite Database Schema
-- ==========================================

-- ==========================================
-- USERS TABLE (Clerk Integration)
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- Clerk userId
    clerk_id TEXT UNIQUE NOT NULL, -- Clerk user identifier
    email TEXT UNIQUE,
    full_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- BIRTH DATA TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS birth_data (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    full_name TEXT NOT NULL,
    date_of_birth TEXT NOT NULL, -- YYYY-MM-DD format
    tentative_time TEXT NOT NULL, -- HH:MM format
    time_uncertainty TEXT, -- 'exact', '5min', '15min', '30min', '1hour', '2hour', '4hour', 'unknown', 'custom'
    birth_place TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    timezone TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female')),
    marital_status TEXT CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
    current_age INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- PHYSICAL DESCRIPTION TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS physical_descriptions (
    id TEXT PRIMARY KEY,
    birth_data_id TEXT NOT NULL,
    body_structure TEXT CHECK (body_structure IN ('slim', 'average', 'heavy', 'athletic')),
    height TEXT CHECK (height IN ('short', 'average', 'tall')),
    face_shape TEXT CHECK (face_shape IN ('round', 'oval', 'square', 'angular', 'heart')),
    complexion TEXT CHECK (complexion IN ('fair', 'wheatish', 'dark')),
    distinctive_features TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (birth_data_id) REFERENCES birth_data(id) ON DELETE CASCADE
);

-- ==========================================
-- LIFE EVENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS life_events (
    id TEXT PRIMARY KEY,
    birth_data_id TEXT NOT NULL,
    category TEXT NOT NULL, -- 'education', 'career', 'marriage', 'children', 'family', 'health', 'financial', 'travel', 'spiritual', 'other'
    event_type TEXT NOT NULL,
    event_date TEXT NOT NULL,
    date_accuracy TEXT CHECK (date_accuracy IN ('exact', 'month', 'year', 'approximate', 'range', 'month-range', 'year-range')),
    description TEXT,
    importance TEXT CHECK (importance IN ('critical', 'high', 'medium', 'low')),
    event_time TEXT, -- HH:MM format for exact dates
    metadata TEXT, -- JSON string for additional data
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (birth_data_id) REFERENCES birth_data(id) ON DELETE CASCADE
);

-- ==========================================
-- CALCULATION SESSIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS calculation_sessions (
    id TEXT PRIMARY KEY,
    birth_data_id TEXT NOT NULL,
    session_token TEXT UNIQUE,
    current_step INTEGER DEFAULT 1,
    is_complete BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (birth_data_id) REFERENCES birth_data(id) ON DELETE CASCADE
);

-- ==========================================
-- RECTIFICATION RESULTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS rectification_results (
    id TEXT PRIMARY KEY,
    birth_data_id TEXT NOT NULL,
    session_id TEXT,
    original_time TEXT NOT NULL,
    rectified_time TEXT NOT NULL,
    adjustment_minutes REAL,
    confidence_score REAL,
    confidence_level TEXT CHECK (confidence_level IN ('very_high', 'high', 'moderate', 'low')),
    primary_method TEXT,
    methods_used TEXT, -- JSON array of methods
    executive_summary TEXT,
    recommendations TEXT, -- JSON array of recommendations
    rectified_chart_data TEXT, -- JSON string of ChartCalculation
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (birth_data_id) REFERENCES birth_data(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES calculation_sessions(id) ON DELETE SET NULL
);

-- ==========================================
-- EVENT ANALYSIS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS event_analyses (
    id TEXT PRIMARY KEY,
    result_id TEXT NOT NULL,
    life_event_id TEXT NOT NULL,
    dasha_bhukti TEXT,
    relevant_charts TEXT, -- JSON array of chart types
    match_quality TEXT CHECK (match_quality IN ('strong', 'moderate', 'weak', 'mismatch')),
    explanation TEXT,
    supporting_factors TEXT, -- JSON array
    concerning_factors TEXT, -- JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (result_id) REFERENCES rectification_results(id) ON DELETE CASCADE,
    FOREIGN KEY (life_event_id) REFERENCES life_events(id) ON DELETE CASCADE
);

-- ==========================================
-- PHYSICAL VERIFICATION TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS physical_verifications (
    id TEXT PRIMARY KEY,
    result_id TEXT NOT NULL,
    overall_match TEXT CHECK (overall_match IN ('strong', 'moderate', 'weak')),
    matches TEXT, -- JSON array of matching factors
    mismatches TEXT, -- JSON array of mismatching factors
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (result_id) REFERENCES rectification_results(id) ON DELETE CASCADE
);

-- ==========================================
-- BTR REAL-TIME CALCULATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS btr_calculations (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    phase TEXT NOT NULL, -- 'initialization', 'phase1', 'phase2', 'phase3', 'finalization', 'complete'
    progress_percentage REAL,
    candidate_time TEXT,
    alignment_score REAL,
    calculations_data TEXT, -- JSON string of SwissEphCalculation
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES calculation_sessions(id) ON DELETE CASCADE
);

-- ==========================================
-- AI ANALYSIS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS ai_analyses (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    analysis_type TEXT, -- 'time_slot', 'final_report', 'physical_verification'
    recommended_birth_time TEXT,
    confidence_level INTEGER,
    reasoning TEXT,
    physical_traits_match TEXT,
    life_events_correlation TEXT,
    dasha_alignment TEXT,
    analysis_data TEXT, -- JSON string of complete analysis
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES calculation_sessions(id) ON DELETE CASCADE
);

-- ==========================================
-- ACTIVITY LOG TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    activity_type TEXT NOT NULL, -- 'calculation', 'analysis', 'verification', 'error'
    message TEXT NOT NULL,
    details TEXT, -- JSON string of additional details
    FOREIGN KEY (session_id) REFERENCES calculation_sessions(id) ON DELETE CASCADE
);

-- ==========================================
-- USER SESSIONS TABLE (for authentication)
-- ==========================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- Indexes for birth_data
CREATE INDEX IF NOT EXISTS idx_birth_data_user_id ON birth_data(user_id);
CREATE INDEX IF NOT EXISTS idx_birth_data_created_at ON birth_data(created_at);

-- Indexes for life_events
CREATE INDEX IF NOT EXISTS idx_life_events_birth_data_id ON life_events(birth_data_id);
CREATE INDEX IF NOT EXISTS idx_life_events_category ON life_events(category);
CREATE INDEX IF NOT EXISTS idx_life_events_importance ON life_events(importance);

-- Indexes for calculation_sessions
CREATE INDEX IF NOT EXISTS idx_calculation_sessions_user_id ON calculation_sessions(birth_data_id);
CREATE INDEX IF NOT EXISTS idx_calculation_sessions_token ON calculation_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_calculation_sessions_complete ON calculation_sessions(is_complete);

-- Indexes for rectification_results
CREATE INDEX IF NOT EXISTS idx_rectification_results_birth_data_id ON rectification_results(birth_data_id);
CREATE INDEX IF NOT EXISTS idx_rectification_results_session_id ON rectification_results(session_id);
CREATE INDEX IF NOT EXISTS idx_rectification_results_confidence ON rectification_results(confidence_level);

-- Indexes for btr_calculations
CREATE INDEX IF NOT EXISTS idx_btr_calculations_session_id ON btr_calculations(session_id);
CREATE INDEX IF NOT EXISTS idx_btr_calculations_phase ON btr_calculations(phase);

-- Indexes for ai_analyses
CREATE INDEX IF NOT EXISTS idx_ai_analyses_session_id ON ai_analyses(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_type ON ai_analyses(analysis_type);

-- Indexes for activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_session_id ON activity_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(activity_type);

-- ==========================================
-- VIEWS FOR COMMON QUERIES
-- ==========================================

-- View: User calculations summary
CREATE VIEW IF NOT EXISTS user_calculations_summary AS
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    COUNT(DISTINCT bd.id) as total_calculations,
    COUNT(DISTINCT CASE WHEN r.confidence_level IN ('high', 'very_high') THEN r.id END) as high_confidence_results,
    MAX(r.created_at) as last_calculation_date
FROM users u
LEFT JOIN birth_data bd ON u.id = bd.user_id
LEFT JOIN rectification_results r ON bd.id = r.birth_data_id
GROUP BY u.id, u.email, u.full_name;

-- View: Recent calculations with details
CREATE VIEW IF NOT EXISTS recent_calculations AS
SELECT 
    r.id as result_id,
    bd.full_name,
    bd.date_of_birth,
    r.original_time,
    r.rectified_time,
    r.adjustment_minutes,
    r.confidence_score,
    r.confidence_level,
    r.created_at,
    COUNT(DISTINCT le.id) as total_events,
    COUNT(DISTINCT ea.id) as analyzed_events
FROM rectification_results r
JOIN birth_data bd ON r.birth_data_id = bd.id
LEFT JOIN life_events le ON bd.id = le.birth_data_id
LEFT JOIN event_analyses ea ON r.id = ea.result_id
GROUP BY r.id
ORDER BY r.created_at DESC;

-- ==========================================
-- TRIGGERS FOR DATA INTEGRITY
-- ==========================================

-- Trigger: Update birth_data updated_at
CREATE TRIGGER IF NOT EXISTS update_birth_data_timestamp 
AFTER UPDATE ON birth_data
FOR EACH ROW
BEGIN
    UPDATE birth_data SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger: Update physical_descriptions updated_at
CREATE TRIGGER IF NOT EXISTS update_physical_descriptions_timestamp 
AFTER UPDATE ON physical_descriptions
FOR EACH ROW
BEGIN
    UPDATE physical_descriptions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger: Update life_events updated_at
CREATE TRIGGER IF NOT EXISTS update_life_events_timestamp 
AFTER UPDATE ON life_events
FOR EACH ROW
BEGIN
    UPDATE life_events SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ==========================================
-- INITIAL DATA: Event Types Reference
-- ==========================================

-- Insert event types reference data (optional, for validation)
CREATE TABLE IF NOT EXISTS event_types_reference (
    category TEXT NOT NULL,
    event_type TEXT NOT NULL,
    description TEXT,
    PRIMARY KEY (category, event_type)
);

-- Sample event types (you can expand this based on EVENT_TYPES in your code)
INSERT OR IGNORE INTO event_types_reference (category, event_type, description) VALUES
('education', 'School Completion (10th)', 'Completion of secondary school education'),
('education', 'Higher Secondary (12th)', 'Completion of higher secondary education'),
('education', 'Bachelor\'s Degree Start', 'Starting undergraduate studies'),
('education', 'Bachelor\'s Degree Completion', 'Completing undergraduate degree'),
('career', 'First Job', 'First professional employment'),
('career', 'Job Change', 'Changing to a new job'),
('career', 'Promotion', 'Professional advancement'),
('career', 'Business Start', 'Starting a new business'),
('marriage', 'Marriage', 'Getting married'),
('marriage', 'Engagement', 'Getting engaged'),
('marriage', 'Divorce', 'Divorce or separation'),
('children', 'First Child Birth', 'Birth of first child'),
('children', 'Second Child Birth', 'Birth of second child'),
('family', 'Father\'s Death', 'Loss of father'),
('family', 'Mother\'s Death', 'Loss of mother'),
('health', 'Major Illness', 'Serious health issue'),
('health', 'Surgery', 'Undergoing surgery'),
('health', 'Accident/Injury', 'Major accident or injury'),
('financial', 'First Property Purchase', 'Buying first property'),
('financial', 'Vehicle Purchase', 'Buying a vehicle'),
('financial', 'Major Investment', 'Significant financial investment'),
('travel', 'First Foreign Trip', 'First international travel'),
('travel', 'Settlement Abroad', 'Moving to another country'),
('spiritual', 'Spiritual Initiation/Diksha', 'Spiritual initiation ceremony'),
('spiritual', 'Meeting Guru', 'Meeting spiritual teacher');

-- ==========================================
-- END OF SCHEMA
-- ==========================================

-- Comments for implementation:
-- 1. Run this schema in Turso: turso db shell your-db < schema.sql
-- 2. All tables use TEXT for IDs to support UUIDs
-- 3. JSON data is stored as TEXT and should be parsed in application
-- 4. Foreign keys ensure data integrity with CASCADE deletes
-- 5. Indexes optimize common query patterns
-- 6. Views provide easy access to summary data
