-- ============================================================
-- MAHATMA GANDHI BTR ANALYSIS JOB
-- Window: 07:11:00 ± 30 minutes (06:41 to 07:41)
-- Generated: 2026-03-18
-- ============================================================

-- Insert Session
INSERT INTO sessions (
    id,
    "userId",
    status,
    progress,
    "currentStage",
    "birthData",
    "lifeEvents", 
    "forensicTraits",
    "offsetMinutes",
    "createdAt",
    "updatedAt"
) VALUES (
    'gandhi_btr_1773806170000',
    'research_gandhi',
    'pending',
    0,
    'init',
    '{
        "fullName": "Mohandas Karamchand Gandhi",
        "dateOfBirth": "1869-10-02",
        "tentativeTime": "07:11:00",
        "latitude": 21.6417,
        "longitude": 69.6293,
        "timezone": "Asia/Kolkata",
        "birthPlace": "Porbandar, Gujarat, India",
        "gender": "male"
    }'::jsonb,
    '[
        {"id": "evt-001", "date": "1869-10-02", "eventType": "birth", "description": "Birth at Porbandar", "importance": "critical", "datePrecision": "exact_date"},
        {"id": "evt-002", "date": "1876-01-01", "eventType": "family", "description": "Father Karamchand Gandhi dies", "importance": "high", "datePrecision": "exact_date"},
        {"id": "evt-003", "date": "1883-05-01", "eventType": "marriage", "description": "Marriage to Kasturba Makhanji", "importance": "high", "datePrecision": "exact_date"},
        {"id": "evt-004", "date": "1888-09-01", "eventType": "education", "description": "Departs for London to study law", "importance": "high", "datePrecision": "exact_date"},
        {"id": "evt-005", "date": "1891-06-01", "eventType": "education", "description": "Returns to India as barrister", "importance": "high", "datePrecision": "exact_date"},
        {"id": "evt-006", "date": "1893-04-01", "eventType": "career", "description": "Leaves for South Africa", "importance": "critical", "datePrecision": "exact_date"},
        {"id": "evt-007", "date": "1893-05-01", "eventType": "crisis", "description": "Thrown off train at Pietermaritzburg", "importance": "critical", "datePrecision": "exact_date"},
        {"id": "evt-008", "date": "1894-01-01", "eventType": "career", "description": "Founds Natal Indian Congress", "importance": "high", "datePrecision": "exact_date"},
        {"id": "evt-009", "date": "1897-01-01", "eventType": "crisis", "description": "Attacked by mob in Durban", "importance": "high", "datePrecision": "exact_date"},
        {"id": "evt-010", "date": "1904-01-01", "eventType": "spiritual", "description": "Establishes Phoenix Settlement", "importance": "high", "datePrecision": "exact_date"},
        {"id": "evt-011", "date": "1906-09-01", "eventType": "spiritual", "description": "Takes Brahmacharya vow", "importance": "critical", "datePrecision": "exact_date"},
        {"id": "evt-012", "date": "1906-09-11", "eventType": "career", "description": "First Satyagraha campaign begins", "importance": "critical", "datePrecision": "exact_date"},
        {"id": "evt-013", "date": "1908-01-01", "eventType": "crisis", "description": "First imprisonment", "importance": "high", "datePrecision": "exact_date"},
        {"id": "evt-014", "date": "1909-01-01", "eventType": "career", "description": "Writes Hind Swaraj", "importance": "high", "datePrecision": "exact_date"},
        {"id": "evt-015", "date": "1913-01-01", "eventType": "career", "description": "Great March (Transvaal)", "importance": "critical", "datePrecision": "exact_date"},
        {"id": "evt-016", "date": "1914-01-01", "eventType": "career", "description": "Returns to India permanently", "importance": "critical", "datePrecision": "exact_date"},
        {"id": "evt-017", "date": "1915-01-01", "eventType": "spiritual", "description": "Establishes Sabarmati Ashram", "importance": "high", "datePrecision": "exact_date"},
        {"id": "evt-018", "date": "1917-01-01", "eventType": "career", "description": "Champaran Satyagraha", "importance": "critical", "datePrecision": "exact_date"},
        {"id": "evt-019", "date": "1918-01-01", "eventType": "career", "description": "Ahmedabad Mill Strike", "importance": "high", "datePrecision": "exact_date"},
        {"id": "evt-020", "date": "1919-04-13", "eventType": "crisis", "description": "Jallianwala Bagh Massacre", "importance": "critical", "datePrecision": "exact_date"},
        {"id": "evt-021", "date": "1920-09-01", "eventType": "career", "description": "Launches Non-Cooperation Movement", "importance": "critical", "datePrecision": "exact_date"},
        {"id": "evt-022", "date": "1922-03-01", "eventType": "crisis", "description": "Arrested for sedition", "importance": "high", "datePrecision": "exact_date"},
        {"id": "evt-023", "date": "1924-02-01", "eventType": "health", "description": "Released from prison", "importance": "high", "datePrecision": "exact_date"},
        {"id": "evt-024", "date": "1930-03-12", "eventType": "career", "description": "Dandi March begins", "importance": "critical", "datePrecision": "exact_date"},
        {"id": "evt-025", "date": "1930-04-06", "eventType": "career", "description": "Breaks salt laws at Dandi", "importance": "critical", "datePrecision": "exact_date"},
        {"id": "evt-026", "date": "1932-09-01", "eventType": "crisis", "description": "Poona Pact - fast unto death", "importance": "critical", "datePrecision": "exact_date"},
        {"id": "evt-027", "date": "1934-01-01", "eventType": "career", "description": "Retires from Congress Party", "importance": "high", "datePrecision": "exact_date"},
        {"id": "evt-028", "date": "1942-08-08", "eventType": "career", "description": "Quit India Movement launched", "importance": "critical", "datePrecision": "exact_date"},
        {"id": "evt-029", "date": "1942-08-09", "eventType": "crisis", "description": "Arrested (Quit India)", "importance": "high", "datePrecision": "exact_date"},
        {"id": "evt-030", "date": "1944-05-06", "eventType": "family", "description": "Wife Kasturba dies", "importance": "high", "datePrecision": "exact_date"},
        {"id": "evt-031", "date": "1946-08-16", "eventType": "crisis", "description": "Calcutta riots", "importance": "critical", "datePrecision": "exact_date"},
        {"id": "evt-032", "date": "1947-06-01", "eventType": "crisis", "description": "Mountbatten Plan announced", "importance": "critical", "datePrecision": "exact_date"},
        {"id": "evt-033", "date": "1947-08-15", "eventType": "career", "description": "Indian Independence achieved", "importance": "critical", "datePrecision": "exact_date"},
        {"id": "evt-034", "date": "1947-09-01", "eventType": "crisis", "description": "Delhi violence", "importance": "high", "datePrecision": "exact_date"},
        {"id": "evt-035", "date": "1948-01-12", "eventType": "spiritual", "description": "Begins final fast", "importance": "high", "datePrecision": "exact_date"},
        {"id": "evt-036", "date": "1948-01-30", "eventType": "death", "description": "Assassinated by Nathuram Godse", "importance": "critical", "datePrecision": "exact_date"}
    ]'::jsonb,
    '{
        "physical": {
            "complexion": "medium-dark",
            "bodyFrame": "slender-lean",
            "heightEstimate": "average-to-short",
            "distinctiveFeatures": "bald-head, round-spectacles, dhoti-clad",
            "vitality": "frail-but-resilient"
        },
        "temperamental": {
            "speechPattern": "soft-spoken, measured, calm",
            "socialOrientation": "servant-leader, mass-mobilizer",
            "emotionalExpression": "compassionate, non-violent, forgiving",
            "stressResponse": "fasting, prayer, constructive-program",
            "decisionMaking": "consensus-seeking, spiritually-guided"
        },
        "psychographic": {
            "coreValues": "truth-satya, non-violence-ahimsa, self-discipline",
            "lifePhilosophy": "simple-living-high-thinking, trusteeship",
            "spiritualOrientation": "deeply-devout-hindu, universalist",
            "leadershipStyle": "moral-authority, servant-leader",
            "legacyFocus": "social-justice, communal-harmony"
        }
    }'::jsonb,
    30,
    NOW(),
    NOW()
);

-- Insert Job for Worker
INSERT INTO jobs (
    id,
    "sessionId",
    type,
    status,
    priority,
    payload,
    "createdAt",
    "updatedAt",
    attempts,
    "maxAttempts"
) VALUES (
    'gandhi-job-' || extract(epoch from now())::text,
    'gandhi_btr_1773806170000',
    'btr_analysis',
    'pending',
    1,
    '{
        "sessionId": "gandhi_btr_1773806170000",
        "profile": "gandhi",
        "windowMinutes": 30,
        "expectedRange": "06:41:00 to 07:41:00",
        "targetTime": "07:11:00"
    }'::jsonb,
    NOW(),
    NOW(),
    0,
    3
);

-- ============================================================
-- VERIFICATION QUERY
-- ============================================================
-- Check if job was inserted correctly:
-- SELECT * FROM sessions WHERE id = 'gandhi_btr_1773806170000';
-- SELECT * FROM jobs WHERE "sessionId" = 'gandhi_btr_1773806170000';
-- ============================================================
