-- Gandhi BTR Job Insert for Local Database
-- Using actual schema from migrations

INSERT INTO sessions (
    id, "userId", "clerkId", "fullName", "dateOfBirth", "tentativeTime", 
    "birthPlace", latitude, longitude, timezone, gender, "forensicTraits", 
    "lifeEvents", status, "submittedAt", "createdAt", "updatedAt", "isEncrypted"
) VALUES (
    'gandhi_local_' || extract(epoch from now())::bigint,
    'research_gandhi',
    'research_gandhi_clerk',
    'Mohandas Karamchand Gandhi',
    '1869-10-02',
    '07:11:00',
    'Porbandar, Gujarat, India',
    21.6417,
    69.6293,
    'Asia/Kolkata',
    'male',
    '{"physical": {"complexion": "medium-dark", "bodyFrame": "slender-lean"}, "temperamental": {"speechPattern": "soft-spoken"}, "psychographic": {"coreValues": "truth-satya"}}'::text,
    '[{"id": "evt-001", "date": "1869-10-02", "eventType": "birth", "description": "Birth"}, {"id": "evt-002", "date": "1883-05-01", "eventType": "marriage", "description": "Marriage"}, {"id": "evt-003", "date": "1893-05-01", "eventType": "crisis", "description": "Train incident"}, {"id": "evt-004", "date": "1917-01-01", "eventType": "career", "description": "Champaran"}, {"id": "evt-005", "date": "1930-03-12", "eventType": "career", "description": "Dandi March"}, {"id": "evt-006", "date": "1942-08-08", "eventType": "career", "description": "Quit India"}, {"id": "evt-007", "date": "1947-08-15", "eventType": "career", "description": "Independence"}, {"id": "evt-008", "date": "1948-01-30", "eventType": "death", "description": "Assassination"}]'::text,
    'pending',
    NOW(),
    NOW(),
    NOW(),
    false
);

-- Verify insertion
SELECT 'Session created: ' || id as message, status FROM sessions WHERE "fullName" = 'Mohandas Karamchand Gandhi' ORDER BY "createdAt" DESC LIMIT 1;
