/**
 * ============================================================================
 *  Life Events Injection Script for Ashok Saini
 *  DOB: 16 June 1999 | User ID: 7e66f9cb-dd2f-4287-bf0b-d7e74b2a3b18
 *  Session ID: b06c3a81-b58a-4eba-89a3-2f8a1a178d29
 * ============================================================================
 *
 *  Maps 66+ life events to proper EventCategory + eventType from shared types.
 *  Uses predefined types where available, custom types for unmatched events.
 *  Encrypts via AES-256-GCM v4 and writes directly to Neon DB.
 */

import { createEncryption } from '@ai-pandit/shared';
import pg from 'pg';

// ─── Constants ───────────────────────────────────────────────────────────────

const USER_ID = '7e66f9cb-dd2f-4287-bf0b-d7e74b2a3b18';
const SESSION_ID = 'b06c3a81-b58a-4eba-89a3-2f8a1a178d29';
const DOB = new Date('1999-06-16');

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || '';
const DATABASE_URL = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || '';

// ─── Age Calculator ──────────────────────────────────────────────────────────

function ageAt(dateStr: string, precision: 'exact' | 'year' | 'month' = 'year'): number {
  const date = new Date(dateStr);
  const years = date.getFullYear() - DOB.getFullYear();
  if (precision === 'exact') {
    const m = date.getMonth() - DOB.getMonth();
    if (m < 0 || (m === 0 && date.getDate() < DOB.getDate())) {
      return years - 1;
    }
  }
  return years;
}

// ─── Event Builders ──────────────────────────────────────────────────────────

type EventInput = {
  id: string;
  category: string;
  eventType: string;
  datePrecision: string;
  eventDate: string;
  endDate?: string;
  eventTime?: string;
  description: string;
  importance: string;
};

function ev(input: EventInput) {
  return {
    id: input.id,
    category: input.category,
    eventType: input.eventType,
    datePrecision: input.datePrecision,
    eventDate: input.eventDate,
    ...(input.endDate ? { endDate: input.endDate } : {}),
    ...(input.eventTime ? { eventTime: input.eventTime } : {}),
    description: input.description,
    importance: input.importance,
    ageAtEvent: ageAt(input.eventDate),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
//  LIFE EVENTS — 66+ events with proper categories matching shared EventCategory
// ═══════════════════════════════════════════════════════════════════════════════

const events = [
  // ── BIRTH & CHILDHOOD ──────────────────────────────────────────────────────
  ev({
    id: 'evt_birth', category: 'btr_markers', eventType: 'Birth time verification',
    datePrecision: 'exact_date_time', eventDate: '1999-06-16', eventTime: '09:50',
    description: 'Born in Chaksu, Rajasthan. Approximate time 9:50 AM IST.',
    importance: 'critical',
  }),
  ev({
    id: 'evt_childhood_village', category: 'childhood', eventType: 'Milestone event',
    datePrecision: 'year_range', eventDate: '1999', endDate: '2003',
    description: 'Early childhood spent in village. Carefree village life.',
    importance: 'medium',
  }),

  // ── EDUCATION ──────────────────────────────────────────────────────────────
  ev({
    id: 'evt_school_start', category: 'education', eventType: 'School admission',
    datePrecision: 'month_year', eventDate: '2003-06',
    description: 'Started formal schooling — 1st class admission.',
    importance: 'medium',
  }),
  ev({
    id: 'evt_village_school', category: 'education', eventType: 'School admission',
    datePrecision: 'year_range', eventDate: '2003', endDate: '2006',
    description: 'Studied in village school. 1st to 3rd standard.',
    importance: 'low',
  }),
  ev({
    id: 'evt_bright_school', category: 'education', eventType: 'School admission',
    datePrecision: 'month_year', eventDate: '2006-07',
    description: 'First city school after moving to Jaipur — Bright School, 4th Std.',
    importance: 'low',
  }),
  ev({
    id: 'evt_nirmala_school', category: 'education', eventType: 'School admission',
    datePrecision: 'month_year', eventDate: '2006-08',
    description: 'Second school change within a month — Nirmala Modern School, 4th Std.',
    importance: 'low',
  }),
  ev({
    id: 'evt_vivekanand_school', category: 'education', eventType: 'School admission',
    datePrecision: 'month_year', eventDate: '2007-07',
    description: 'Third school — Vivekanand School, 5th Std.',
    importance: 'low',
  }),
  ev({
    id: 'evt_kamaldeep_school', category: 'education', eventType: 'School admission',
    datePrecision: 'year_range', eventDate: '2008', endDate: '2011',
    description: '6th-8th Std at Kamal Deep School. Average student, lacked self-belief.',
    importance: 'low',
  }),
  ev({
    id: 'evt_vikas_school', category: 'education', eventType: 'School admission',
    datePrecision: 'month_year', eventDate: '2011-07',
    description: '9th Std at Vikas International School — BREAKTHROUGH year, got 1st rank.',
    importance: 'high',
  }),
  ev({
    id: 'evt_first_rank', category: 'awards', eventType: 'Award',
    datePrecision: 'year_range', eventDate: '2011', endDate: '2012',
    description: 'Got 1st rank in 9th standard. Major academic breakthrough — first time topping class.',
    importance: 'critical',
  }),
  ev({
    id: 'evt_shreeji_school', category: 'education', eventType: 'School admission',
    datePrecision: 'month_year', eventDate: '2012-05',
    description: '10th Std at Shree Ji School. Dominated peers, teacher\'s favorite.',
    importance: 'high',
  }),
  ev({
    id: 'evt_10th_result', category: 'awards', eventType: 'Award',
    datePrecision: 'exact_date_time', eventDate: '2013-06-06', eventTime: '16:00',
    description: '10th Board Result — 91.50%, highest in class, 2nd in the area.',
    importance: 'critical',
  }),
  ev({
    id: 'evt_iitjee_coaching', category: 'education', eventType: 'Higher studies',
    datePrecision: 'year_range', eventDate: '2013', endDate: '2015',
    description: '11th-12th at Riya International Academy (dummy school) + IIT-JEE coaching.',
    importance: 'medium',
  }),
  ev({
    id: 'evt_12th_result', category: 'awards', eventType: 'Award',
    datePrecision: 'exact_date', eventDate: '2015-05-22',
    description: '12th Board Result — 93.60% in PCM, 4th in school, highest in area.',
    importance: 'critical',
  }),
  ev({
    id: 'evt_jee_mains', category: 'education', eventType: 'Higher studies',
    datePrecision: 'exact_date', eventDate: '2015-07-07',
    description: 'JEE Mains Result — AIR 5672.',
    importance: 'critical',
  }),
  ev({
    id: 'evt_nit_admission', category: 'education', eventType: 'College admission',
    datePrecision: 'month_year', eventDate: '2015-07',
    description: 'NIT Jaipur Admission — Electrical Engineering, 1st choice, 1st round.',
    importance: 'critical',
  }),
  ev({
    id: 'evt_nit_sem1', category: 'education', eventType: 'Higher studies',
    datePrecision: 'month_range', eventDate: '2015-07', endDate: '2015-11',
    description: '1st Semester NIT Jaipur — Hindi medium struggle, SGPA 7.42. Barely passed.',
    importance: 'high',
  }),
  ev({
    id: 'evt_nit_sem4', category: 'education', eventType: 'Higher studies',
    datePrecision: 'month_range', eventDate: '2017-01', endDate: '2017-04',
    description: '4th Semester NIT — SGPA 9.46. Peak academic performance in college.',
    importance: 'high',
  }),
  ev({
    id: 'evt_nit_sem7', category: 'education', eventType: 'Higher studies',
    datePrecision: 'month_range', eventDate: '2018-08', endDate: '2018-11',
    description: '7th Semester NIT — Friends helped immensely after accident. SGPA 8.00.',
    importance: 'high',
  }),
  ev({
    id: 'evt_gate_2019', category: 'education', eventType: 'Higher studies',
    datePrecision: 'exact_date', eventDate: '2019-03-15',
    description: 'GATE 2019 Result — AIR ~1700. Very disappointed with the rank.',
    importance: 'critical',
  }),
  ev({
    id: 'evt_gate_prep2', category: 'education', eventType: 'Higher studies',
    datePrecision: 'month_range', eventDate: '2019-11', endDate: '2020-02',
    description: 'Second attempt GATE preparation. Determined to improve rank.',
    importance: 'medium',
  }),
  ev({
    id: 'evt_ies_coaching', category: 'education', eventType: 'Higher studies',
    datePrecision: 'month_year', eventDate: '2020-02',
    description: 'Joined IES (Indian Engineering Services) coaching.',
    importance: 'medium',
  }),
  ev({
    id: 'evt_gate_2020', category: 'education', eventType: 'Higher studies',
    datePrecision: 'exact_date', eventDate: '2020-03-13',
    description: 'GATE 2020 Result — AIR 770. Significant improvement.',
    importance: 'high',
  }),
  ev({
    id: 'evt_gate_2021', category: 'education', eventType: 'Higher studies',
    datePrecision: 'exact_date', eventDate: '2021-03-19',
    description: 'GATE 2021 Result — AIR 377. Hoping for OLD IIT admission.',
    importance: 'critical',
  }),
  ev({
    id: 'evt_iit_applications', category: 'education', eventType: 'College admission',
    datePrecision: 'month_range', eventDate: '2021-04', endDate: '2021-06',
    description: 'Applied to multiple IITs. Got admission in IIT Roorkee, Kanpur, Kharagpur, Madras, IISc Bangalore, Delhi.',
    importance: 'high',
  }),
  ev({
    id: 'evt_iit_delhi', category: 'education', eventType: 'College admission',
    datePrecision: 'exact_date', eventDate: '2021-07-13',
    description: 'Joined IIT Delhi — M.Tech in desired specialization. First engineer in family.',
    importance: 'critical',
  }),

  // ── CAREER ─────────────────────────────────────────────────────────────────
  ev({
    id: 'evt_maruti_placement', category: 'career', eventType: 'Job start',
    datePrecision: 'exact_date', eventDate: '2018-10-01',
    description: 'Maruti Suzuki Placement — Electrical Engineer role. Unexpected campus placement.',
    importance: 'critical',
  }),
  ev({
    id: 'evt_freelance_job', category: 'career', eventType: 'Business start',
    datePrecision: 'month_range', eventDate: '2019-05', endDate: '2019-06',
    description: 'Got wonderful foreign freelancing opportunity — first professional income source.',
    importance: 'high',
  }),
  ev({
    id: 'evt_first_salary', category: 'financial', eventType: 'Money gain',
    datePrecision: 'exact_date', eventDate: '2019-06-07',
    description: 'First salary/payment received — milestone first earning.',
    importance: 'critical',
  }),
  ev({
    id: 'evt_declined_maruti', category: 'career', eventType: 'Job change',
    datePrecision: 'exact_date', eventDate: '2019-07-05',
    description: 'Declined Maruti Suzuki job offer. Called HR during Vrindavan trip.',
    importance: 'critical',
  }),
  ev({
    id: 'evt_ssc_je_pre', category: 'career', eventType: 'Job start',
    datePrecision: 'date_range', eventDate: '2021-06-30', endDate: '2021-07-03',
    description: 'SSC JEn Pre Exam — cleared the preliminary round.',
    importance: 'high',
  }),
  ev({
    id: 'evt_ssc_je_mains', category: 'career', eventType: 'Job start',
    datePrecision: 'exact_date', eventDate: '2021-09-26',
    description: 'SSC JEn Mains Exam — went to Old Delhi for examination.',
    importance: 'high',
  }),
  ev({
    id: 'evt_iocl_interview', category: 'career', eventType: 'Job start',
    datePrecision: 'exact_date', eventDate: '2021-10-07',
    description: 'IOCL Interview — went to Gurgaon, Haryana.',
    importance: 'critical',
  }),
  ev({
    id: 'evt_iocl_selection', category: 'career', eventType: 'Job start',
    datePrecision: 'exact_date_time', eventDate: '2021-11-14', eventTime: '19:00',
    description: 'IOCL Selection — Grade A Officer. Unexpected selection in PSU.',
    importance: 'critical',
  }),
  ev({
    id: 'evt_joined_iocl', category: 'career', eventType: 'Job start',
    datePrecision: 'exact_date', eventDate: '2021-12-13',
    description: 'Joined IOCL — Gujarat Refinery, Vadodara.',
    importance: 'critical',
  }),
  ev({
    id: 'evt_ntpc_cil', category: 'career', eventType: 'Job start',
    datePrecision: 'month_year', eventDate: '2022-01',
    description: 'Selected in both NTPC and CIL (two additional PSUs).',
    importance: 'high',
  }),
  ev({
    id: 'evt_ssc_je_selection', category: 'career', eventType: 'Job start',
    datePrecision: 'exact_date', eventDate: '2022-02-25',
    description: 'SSC JEn Final Selection — 3rd PSU selection.',
    importance: 'critical',
  }),
  ev({
    id: 'evt_iocl_promotion', category: 'promotion', eventType: 'Promotion',
    datePrecision: 'exact_date', eventDate: '2025-04-27',
    description: 'Job promotion at IOCL. Career stable, anxiety/depression gone.',
    importance: 'critical',
  }),
  ev({
    id: 'evt_career_improved', category: 'career', eventType: 'Promotion',
    datePrecision: 'month_year', eventDate: '2025-12',
    description: 'Work situation improved significantly after challenging period.',
    importance: 'high',
  }),

  // ── HEALTH ─────────────────────────────────────────────────────────────────
  ev({
    id: 'evt_appendicitis', category: 'surgery', eventType: 'Surgery',
    datePrecision: 'month_year', eventDate: '2011-12',
    description: 'Appendicitis surgery — major medical procedure.',
    importance: 'critical',
  }),
  ev({
    id: 'evt_skin_disease', category: 'health', eventType: 'Major illness',
    datePrecision: 'year_range', eventDate: '2011', endDate: '2012',
    description: 'Lots of skin-related diseases and issues.',
    importance: 'medium',
  }),
  ev({
    id: 'evt_major_accident', category: 'accident', eventType: 'Accident',
    datePrecision: 'exact_date_time', eventDate: '2018-05-09', eventTime: '11:30',
    description: 'MAJOR ACCIDENT — Heavy road accident with grandfather. One eye, one leg, both hands, head seriously damaged. ICU for 5 days. Grandfather\'s legs broken.',
    importance: 'critical',
  }),
  ev({
    id: 'evt_bedridden', category: 'health', eventType: 'Recovery',
    datePrecision: 'date_range', eventDate: '2018-05-09', endDate: '2018-07-31',
    description: 'Bedridden for almost 2 months after the major accident. Slow recovery.',
    importance: 'critical',
  }),
  ev({
    id: 'evt_depression_anxiety', category: 'health', eventType: 'Major illness',
    datePrecision: 'date_range', eventDate: '2022-04-01', endDate: '2022-09-30',
    description: 'Depression and anxiety period. Wanted to switch job, mental health struggled.',
    importance: 'critical',
  }),
  ev({
    id: 'evt_gym_transform', category: 'identity_shifts', eventType: 'Weight transform',
    datePrecision: 'date_range', eventDate: '2024-01-01', endDate: '2024-12-31',
    description: 'Physical transformation — gym training. Weight 50kg → 62kg, built muscles, improved looks.',
    importance: 'critical',
  }),
  ev({
    id: 'evt_dermatologist', category: 'health', eventType: 'Recovery',
    datePrecision: 'date_range', eventDate: '2025-03-01', endDate: '2025-05-31',
    description: 'Dermatologist treatment — face acne cleared, looks improved significantly.',
    importance: 'high',
  }),
  ev({
    id: 'evt_workplace_depression', category: 'health', eventType: 'Major illness',
    datePrecision: 'year_range', eventDate: '2025', endDate: '2025',
    description: 'Workplace challenges caused depression due to pending jobs.',
    importance: 'high',
  }),

  // ── FAMILY ─────────────────────────────────────────────────────────────────
  ev({
    id: 'evt_father_good_earning', category: 'financial', eventType: 'Money gain',
    datePrecision: 'year_range', eventDate: '1999', endDate: '2010',
    description: 'Father\'s good earning period — LIC agent type work. Bought properties in village and city.',
    importance: 'medium',
  }),
  ev({
    id: 'evt_shifted_jaipur', category: 'relocation', eventType: 'City move',
    datePrecision: 'month_range', eventDate: '2006-06', endDate: '2006-07',
    description: 'Family shifted from village to Jaipur — parents, sister & me moved to city.',
    importance: 'critical',
  }),
  ev({
    id: 'evt_rented_house', category: 'relocation', eventType: 'City move',
    datePrecision: 'month_range', eventDate: '2006-07', endDate: '2006-09',
    description: 'Lived 3 months in rented house before buying own home.',
    importance: 'medium',
  }),
  ev({
    id: 'evt_bought_house', category: 'property', eventType: 'Property purchase',
    datePrecision: 'month_year', eventDate: '2006-10',
    description: 'Father bought house near Diwali. Family shifted to own home in Jaipur.',
    importance: 'critical',
  }),
  ev({
    id: 'evt_father_jobless', category: 'family', eventType: 'Family event',
    datePrecision: 'year_range', eventDate: '2011', endDate: '2015',
    description: 'Father jobless period — family struggled financially for 4 years.',
    importance: 'critical',
  }),
  ev({
    id: 'evt_sister_marriage', category: 'family', eventType: 'Family event',
    datePrecision: 'month_year', eventDate: '2014-04',
    description: 'Elder sister got married. Marriage started with difficulties, later improved.',
    importance: 'critical',
  }),
  ev({
    id: 'evt_family_provider', category: 'financial', eventType: 'Money gain',
    datePrecision: 'year_range', eventDate: '2019', endDate: '2019',
    description: 'Took over family financial responsibility. Father left job, I became the breadwinner.',
    importance: 'critical',
  }),
  ev({
    id: 'evt_grandfather_accident', category: 'accident', eventType: 'Accident',
    datePrecision: 'exact_date', eventDate: '2018-05-09',
    description: 'Grandfather\'s legs broken in the same accident (9 May 2018).',
    importance: 'high',
  }),

  // ── TRAVEL ─────────────────────────────────────────────────────────────────
  ev({
    id: 'evt_vrindavan_1', category: 'travel', eventType: 'Long journey',
    datePrecision: 'date_range', eventDate: '2019-02-12', endDate: '2019-02-15',
    description: 'Vrindavan visit with college friends. First spiritual trip.',
    importance: 'medium',
  }),
  ev({
    id: 'evt_first_flight', category: 'travel', eventType: 'Long journey',
    datePrecision: 'date_range', eventDate: '2019-05-19', endDate: '2019-05-21',
    description: 'First flight journey — Mumbai visit for BARC Interview. First time in airplane.',
    importance: 'critical',
  }),
  ev({
    id: 'evt_vrindavan_2', category: 'travel', eventType: 'Long journey',
    datePrecision: 'date_range', eventDate: '2019-07-04', endDate: '2019-07-06',
    description: 'Vrindavan visit with school friends.',
    importance: 'medium',
  }),
  ev({
    id: 'evt_village_life', category: 'travel', eventType: 'Relocation',
    datePrecision: 'date_range', eventDate: '2019-07-01', endDate: '2019-10-31',
    description: 'Village life — earning effortlessly from freelancing, enjoyed village stay.',
    importance: 'high',
  }),
  ev({
    id: 'evt_vrindavan_3', category: 'travel', eventType: 'Long journey',
    datePrecision: 'month_year', eventDate: '2019-11',
    description: 'Vrindavan visit 3 — with village uncles & cousins, acted as guide.',
    importance: 'medium',
  }),
  ev({
    id: 'evt_lockdown_stay', category: 'travel', eventType: 'Relocation',
    datePrecision: 'date_range', eventDate: '2020-03-21', endDate: '2020-06-30',
    description: 'Lockdown village stay — 3-4 months, did nothing productive.',
    importance: 'medium',
  }),

  // ── PROPERTY / VEHICLE ─────────────────────────────────────────────────────
  ev({
    id: 'evt_bought_car', category: 'property', eventType: 'Property purchase',
    datePrecision: 'exact_date', eventDate: '2025-11-17',
    description: 'Bought car — old car purchased. First vehicle ownership.',
    importance: 'high',
  }),

  // ── RELATIONSHIPS (using 'other' category with custom eventType) ───────────
  ev({
    id: 'evt_school_crush', category: 'other', eventType: 'Romantic interest',
    datePrecision: 'date_range', eventDate: '2015-03-01', endDate: '2015-07-31',
    description: 'School crush — liked a girl, she got married that same year.',
    importance: 'medium',
  }),
  ev({
    id: 'evt_college_crush', category: 'other', eventType: 'Romantic interest',
    datePrecision: 'year_range', eventDate: '2017', endDate: '2018',
    description: 'College crush — liked a girl who already had a boyfriend.',
    importance: 'medium',
  }),
  ev({
    id: 'evt_neighbour_crush', category: 'other', eventType: 'Romantic interest',
    datePrecision: 'date_range', eventDate: '2018-11-01', endDate: '2020-12-31',
    description: 'Neighbourhood crush — never talked to her.',
    importance: 'low',
  }),
  ev({
    id: 'evt_nepal_girl', category: 'other', eventType: 'Romantic interest',
    datePrecision: 'date_range', eventDate: '2022-10-01', endDate: '2023-12-31',
    description: 'Nepal girl love story — met during PM Modi event. Medical student. One-sided love, confessed, politely denied.',
    importance: 'critical',
  }),

  // ── LIFESTYLE / OTHER ──────────────────────────────────────────────────────
  ev({
    id: 'evt_unproductive_period', category: 'other', eventType: 'Life transition',
    datePrecision: 'date_range', eventDate: '2020-07-01', endDate: '2020-10-31',
    description: 'Unproductive period — did nothing productive for months.',
    importance: 'low',
  }),
];

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN — Encrypt and inject into DB
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log(`\n🔐 Injecting ${events.length} life events for user ${USER_ID}`);

  // 1. Validate env
  if (!ENCRYPTION_SECRET) throw new Error('ENCRYPTION_SECRET not set');
  if (!DATABASE_URL) throw new Error('DATABASE_URL / NEON_DATABASE_URL not set');
  if (ENCRYPTION_SECRET.length < 32) throw new Error(`ENCRYPTION_SECRET too short: ${ENCRYPTION_SECRET.length} chars (need ≥32)`);

  // 2. Create encryption instance
  const crypto = createEncryption(ENCRYPTION_SECRET);

  // 3. Encrypt life events as JSON
  const jsonEvents = JSON.stringify(events);
  const encrypted = crypto.encrypt(jsonEvents, USER_ID);

  console.log(`   Plaintext length: ${jsonEvents.length} chars`);
  console.log(`   Encrypted length: ${encrypted.length} chars`);
  console.log(`   Format: ${encrypted.startsWith('v4:') ? 'v4 ✅' : 'UNKNOWN ❌'}`);

  // 4. Verify round-trip decryption
  const decrypted = crypto.decrypt(encrypted, USER_ID);
  const parsedBack = JSON.parse(decrypted);
  if (parsedBack.length !== events.length) {
    throw new Error(`Round-trip mismatch: expected ${events.length} events, got ${parsedBack.length}`);
  }
  console.log(`   Round-trip verification: ${parsedBack.length} events ✅`);

  // 5. Connect to Neon DB and update
  const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    const result = await client.query(
      `UPDATE sessions SET "lifeEvents" = $1, "updatedAt" = NOW() WHERE id = $2 AND "userId" = $3 RETURNING id, "lifeEvents"`,
      [encrypted, SESSION_ID, USER_ID]
    );

    if (result.rowCount === 0) {
      throw new Error(`Session ${SESSION_ID} not found for user ${USER_ID}`);
    }

    const updatedLen = result.rows[0].lifeEvents?.length || 0;
    console.log(`   ✅ Updated session ${SESSION_ID}`);
    console.log(`   ✅ DB lifeEvents length: ${updatedLen} chars\n`);
  } finally {
    await client.end();
  }

  // 6. Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Category distribution:');
  const cats = new Map<string, number>();
  for (const e of events) cats.set(e.category, (cats.get(e.category) || 0) + 1);
  for (const [cat, count] of [...cats.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${cat.padEnd(20)} ${count}`);
  }
  console.log(`  Total events: ${events.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch((err) => {
  console.error('❌ Injection failed:', err.message);
  process.exit(1);
});
