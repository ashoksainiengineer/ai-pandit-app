import { createEncryption } from '@ai-pandit/shared';
import pg from 'pg';

const SECRET = 'f8e7d6c5b4a3928170654433221100ffeeddccbbaa99887766554433221100ff';
const UID = '7e66f9cb-dd2f-4287-bf0b-d7e74b2a3b18';
const SID = 'b06c3a81-b58a-4eba-89a3-2f8a1a178d29';
const crypto = createEncryption(SECRET);

// Plaintext birth details (decrypted from DB earlier, these are correct)
const BIRTH = {
  fullName: 'Ashok Saini',
  dateOfBirth: '1999-06-16',
  birthPlace: 'Chaksu, Chaksu Tehsil, Rajasthan, India',
  tentativeTime: '09:50:00',
};

// ── Life Events (67 events, same data) ─────────────────────────────────────
const DOB = new Date('1999-06-16');
const ageAt = (d: string) => new Date(d).getFullYear() - DOB.getFullYear();
const ev = (o: any) => ({ ...o, ageAtEvent: ageAt(o.eventDate) });

const events = [
  ev({id:'evt_birth',category:'btr_markers',eventType:'Birth time verification',datePrecision:'exact_date_time',eventDate:'1999-06-16',eventTime:'09:50',description:'Born in Chaksu, Rajasthan. Approximate time 9:50 AM IST.',importance:'critical'}),
  ev({id:'evt_childhood',category:'childhood',eventType:'Milestone event',datePrecision:'year_range',eventDate:'1999',endDate:'2003',description:'Early childhood spent in village. Carefree village life.',importance:'medium'}),
  ev({id:'evt_school_start',category:'education',eventType:'School admission',datePrecision:'month_year',eventDate:'2003-06',description:'Started formal schooling — 1st class admission.',importance:'medium'}),
  ev({id:'evt_village_school',category:'education',eventType:'School admission',datePrecision:'year_range',eventDate:'2003',endDate:'2006',description:'Village school 1st to 3rd standard.',importance:'low'}),
  ev({id:'evt_bright_school',category:'education',eventType:'School admission',datePrecision:'month_year',eventDate:'2006-07',description:'First city school — Bright School, 4th Std.',importance:'low'}),
  ev({id:'evt_nirmala_school',category:'education',eventType:'School admission',datePrecision:'month_year',eventDate:'2006-08',description:'Second school — Nirmala Modern School, 4th Std.',importance:'low'}),
  ev({id:'evt_vivekanand',category:'education',eventType:'School admission',datePrecision:'month_year',eventDate:'2007-07',description:'Third school — Vivekanand School, 5th Std.',importance:'low'}),
  ev({id:'evt_kamaldeep',category:'education',eventType:'School admission',datePrecision:'year_range',eventDate:'2008',endDate:'2011',description:'6th-8th Std at Kamal Deep School. Average student, lacked self-belief.',importance:'low'}),
  ev({id:'evt_vikas_school',category:'education',eventType:'School admission',datePrecision:'month_year',eventDate:'2011-07',description:'9th Std at Vikas International School — BREAKTHROUGH year.',importance:'high'}),
  ev({id:'evt_1st_rank',category:'awards',eventType:'Award',datePrecision:'year_range',eventDate:'2011',endDate:'2012',description:'Got 1st rank in 9th standard. First time topping class.',importance:'critical'}),
  ev({id:'evt_shreeji',category:'education',eventType:'School admission',datePrecision:'month_year',eventDate:'2012-05',description:'10th Std at Shree Ji School. Dominated peers, teacher favorite.',importance:'high'}),
  ev({id:'evt_10th_result',category:'awards',eventType:'Award',datePrecision:'exact_date_time',eventDate:'2013-06-06',eventTime:'16:00',description:'10th Board Result — 91.50%, highest in class, 2nd in area.',importance:'critical'}),
  ev({id:'evt_iitjee_coaching',category:'education',eventType:'Higher studies',datePrecision:'year_range',eventDate:'2013',endDate:'2015',description:'11th-12th at Riya International Academy (dummy school) + IIT-JEE coaching.',importance:'medium'}),
  ev({id:'evt_12th_result',category:'awards',eventType:'Award',datePrecision:'exact_date',eventDate:'2015-05-22',description:'12th Board Result — 93.60% in PCM, 4th in school, highest in area.',importance:'critical'}),
  ev({id:'evt_jee_mains',category:'education',eventType:'Higher studies',datePrecision:'exact_date',eventDate:'2015-07-07',description:'JEE Mains Result — AIR 5672.',importance:'critical'}),
  ev({id:'evt_nit_admission',category:'education',eventType:'College admission',datePrecision:'month_year',eventDate:'2015-07',description:'NIT Jaipur Admission — Electrical Engineering, 1st choice, 1st round.',importance:'critical'}),
  ev({id:'evt_nit_sem1',category:'education',eventType:'Higher studies',datePrecision:'month_range',eventDate:'2015-07',endDate:'2015-11',description:'1st Sem NIT Jaipur — Hindi medium struggle, SGPA 7.42.',importance:'high'}),
  ev({id:'evt_nit_sem4',category:'education',eventType:'Higher studies',datePrecision:'month_range',eventDate:'2017-01',endDate:'2017-04',description:'4th Sem NIT — SGPA 9.46, peak college performance.',importance:'high'}),
  ev({id:'evt_nit_sem7',category:'education',eventType:'Higher studies',datePrecision:'month_range',eventDate:'2018-08',endDate:'2018-11',description:'7th Sem NIT — friends helped after accident, SGPA 8.00.',importance:'high'}),
  ev({id:'evt_gate_2019',category:'education',eventType:'Higher studies',datePrecision:'exact_date',eventDate:'2019-03-15',description:'GATE 2019 Result — AIR ~1700. Very disappointed.',importance:'critical'}),
  ev({id:'evt_gate_prep2',category:'education',eventType:'Higher studies',datePrecision:'month_range',eventDate:'2019-11',endDate:'2020-02',description:'Second GATE preparation attempt. Determined to improve.',importance:'medium'}),
  ev({id:'evt_ies_coaching',category:'education',eventType:'Higher studies',datePrecision:'month_year',eventDate:'2020-02',description:'Joined IES (Indian Engineering Services) coaching.',importance:'medium'}),
  ev({id:'evt_gate_2020',category:'education',eventType:'Higher studies',datePrecision:'exact_date',eventDate:'2020-03-13',description:'GATE 2020 Result — AIR 770. Significant improvement.',importance:'high'}),
  ev({id:'evt_gate_2021',category:'education',eventType:'Higher studies',datePrecision:'exact_date',eventDate:'2021-03-19',description:'GATE 2021 Result — AIR 377. Hoping for OLD IIT.',importance:'critical'}),
  ev({id:'evt_iit_apps',category:'education',eventType:'College admission',datePrecision:'month_range',eventDate:'2021-04',endDate:'2021-06',description:'Got admission to IIT Roorkee, Kanpur, Kharagpur, Madras, IISc Bangalore, Delhi.',importance:'high'}),
  ev({id:'evt_iit_delhi',category:'education',eventType:'College admission',datePrecision:'exact_date',eventDate:'2021-07-13',description:'Joined IIT Delhi — M.Tech in desired specialization. First engineer in family.',importance:'critical'}),
  ev({id:'evt_maruti',category:'career',eventType:'Job start',datePrecision:'exact_date',eventDate:'2018-10-01',description:'Maruti Suzuki Placement — Electrical Engineer role. Unexpected.',importance:'critical'}),
  ev({id:'evt_freelance',category:'career',eventType:'Business start',datePrecision:'month_range',eventDate:'2019-05',endDate:'2019-06',description:'Foreign freelancing opportunity — first professional income source.',importance:'high'}),
  ev({id:'evt_first_salary',category:'financial',eventType:'Money gain',datePrecision:'exact_date',eventDate:'2019-06-07',description:'First salary/payment received — milestone earning.',importance:'critical'}),
  ev({id:'evt_declined_maruti',category:'career',eventType:'Job change',datePrecision:'exact_date',eventDate:'2019-07-05',description:'Declined Maruti Suzuki job. Called HR during Vrindavan trip.',importance:'critical'}),
  ev({id:'evt_ssc_je_pre',category:'career',eventType:'Job start',datePrecision:'date_range',eventDate:'2021-06-30',endDate:'2021-07-03',description:'SSC JEn Pre Exam — cleared preliminary round.',importance:'high'}),
  ev({id:'evt_ssc_je_mains',category:'career',eventType:'Job start',datePrecision:'exact_date',eventDate:'2021-09-26',description:'SSC JEn Mains Exam — went to Old Delhi.',importance:'high'}),
  ev({id:'evt_iocl_interview',category:'career',eventType:'Job start',datePrecision:'exact_date',eventDate:'2021-10-07',description:'IOCL Interview — Gurgaon, Haryana.',importance:'critical'}),
  ev({id:'evt_iocl_selection',category:'career',eventType:'Job start',datePrecision:'exact_date_time',eventDate:'2021-11-14',eventTime:'19:00',description:'IOCL Selection — Grade A Officer. Unexpected PSU selection.',importance:'critical'}),
  ev({id:'evt_joined_iocl',category:'career',eventType:'Job start',datePrecision:'exact_date',eventDate:'2021-12-13',description:'Joined IOCL — Gujarat Refinery, Vadodara.',importance:'critical'}),
  ev({id:'evt_ntpc_cil',category:'career',eventType:'Job start',datePrecision:'month_year',eventDate:'2022-01',description:'Selected in both NTPC and CIL (two additional PSUs).',importance:'high'}),
  ev({id:'evt_ssc_je_sel',category:'career',eventType:'Job start',datePrecision:'exact_date',eventDate:'2022-02-25',description:'SSC JEn Final Selection — 3rd PSU selection.',importance:'critical'}),
  ev({id:'evt_promotion',category:'promotion',eventType:'Promotion',datePrecision:'exact_date',eventDate:'2025-04-27',description:'Job promotion at IOCL. Career stable, anxiety/depression gone.',importance:'critical'}),
  ev({id:'evt_career_ok',category:'career',eventType:'Promotion',datePrecision:'month_year',eventDate:'2025-12',description:'Work situation significantly improved after challenges.',importance:'high'}),
  ev({id:'evt_appendicitis',category:'surgery',eventType:'Surgery',datePrecision:'month_year',eventDate:'2011-12',description:'Appendicitis surgery — major medical procedure.',importance:'critical'}),
  ev({id:'evt_skin',category:'health',eventType:'Major illness',datePrecision:'year_range',eventDate:'2011',endDate:'2012',description:'Lots of skin-related diseases and issues.',importance:'medium'}),
  ev({id:'evt_accident',category:'accident',eventType:'Accident',datePrecision:'exact_date_time',eventDate:'2018-05-09',eventTime:'11:30',description:'MAJOR ROAD ACCIDENT — eye, leg, hands, head seriously damaged. ICU 5 days. Grandfather legs broken.',importance:'critical'}),
  ev({id:'evt_bedridden',category:'health',eventType:'Recovery',datePrecision:'date_range',eventDate:'2018-05-09',endDate:'2018-07-31',description:'Bedridden almost 2 months after accident. Slow recovery.',importance:'critical'}),
  ev({id:'evt_depression',category:'health',eventType:'Major illness',datePrecision:'date_range',eventDate:'2022-04-01',endDate:'2022-09-30',description:'Depression and anxiety — wanted to switch job, mental health struggled.',importance:'critical'}),
  ev({id:'evt_gym',category:'identity_shifts',eventType:'Weight transform',datePrecision:'date_range',eventDate:'2024-01-01',endDate:'2024-12-31',description:'Physical transformation — gym training. Weight 50kg→62kg, built muscles, improved looks.',importance:'critical'}),
  ev({id:'evt_dermatologist',category:'health',eventType:'Recovery',datePrecision:'date_range',eventDate:'2025-03-01',endDate:'2025-05-31',description:'Dermatologist treatment — face acne cleared, looks improved.',importance:'high'}),
  ev({id:'evt_work_depress',category:'health',eventType:'Major illness',datePrecision:'year_range',eventDate:'2025',endDate:'2025',description:'Workplace challenges caused depression due to pending jobs.',importance:'high'}),
  ev({id:'evt_father_earning',category:'financial',eventType:'Money gain',datePrecision:'year_range',eventDate:'1999',endDate:'2010',description:'Father good earning period — LIC agent type work, bought properties.',importance:'medium'}),
  ev({id:'evt_shift_jaipur',category:'relocation',eventType:'City move',datePrecision:'month_range',eventDate:'2006-06',endDate:'2006-07',description:'Family shifted from village to Jaipur — parents, sister & me moved.',importance:'critical'}),
  ev({id:'evt_rent_house',category:'relocation',eventType:'City move',datePrecision:'month_range',eventDate:'2006-07',endDate:'2006-09',description:'3 months in rented house before buying own home.',importance:'medium'}),
  ev({id:'evt_bought_house',category:'property',eventType:'Property purchase',datePrecision:'month_year',eventDate:'2006-10',description:'Father bought house near Diwali. Own home in Jaipur.',importance:'critical'}),
  ev({id:'evt_father_jobless',category:'family',eventType:'Family event',datePrecision:'year_range',eventDate:'2011',endDate:'2015',description:'Father jobless period — family struggled financially 4 years.',importance:'critical'}),
  ev({id:'evt_sister_wed',category:'family',eventType:'Family event',datePrecision:'month_year',eventDate:'2014-04',description:'Elder sister married. Started with difficulties, later improved.',importance:'critical'}),
  ev({id:'evt_family_provider',category:'financial',eventType:'Money gain',datePrecision:'year_range',eventDate:'2019',endDate:'2019',description:'Took family financial responsibility. Father left job, I became breadwinner.',importance:'critical'}),
  ev({id:'evt_grandpa_accident',category:'accident',eventType:'Accident',datePrecision:'exact_date',eventDate:'2018-05-09',description:'Grandfather legs broken in the same 9 May 2018 accident.',importance:'high'}),
  ev({id:'evt_vrindavan1',category:'travel',eventType:'Long journey',datePrecision:'date_range',eventDate:'2019-02-12',endDate:'2019-02-15',description:'Vrindavan visit with college friends. First spiritual trip.',importance:'medium'}),
  ev({id:'evt_first_flight',category:'travel',eventType:'Long journey',datePrecision:'date_range',eventDate:'2019-05-19',endDate:'2019-05-21',description:'First flight journey — Mumbai for BARC Interview. First time in airplane.',importance:'critical'}),
  ev({id:'evt_vrindavan2',category:'travel',eventType:'Long journey',datePrecision:'date_range',eventDate:'2019-07-04',endDate:'2019-07-06',description:'Vrindavan visit with school friends.',importance:'medium'}),
  ev({id:'evt_village_life',category:'travel',eventType:'Relocation',datePrecision:'date_range',eventDate:'2019-07-01',endDate:'2019-10-31',description:'Village life — earning effortlessly from freelancing, enjoyed village stay.',importance:'high'}),
  ev({id:'evt_vrindavan3',category:'travel',eventType:'Long journey',datePrecision:'month_year',eventDate:'2019-11',description:'Vrindavan visit 3 — with village uncles & cousins, acted as guide.',importance:'medium'}),
  ev({id:'evt_lockdown',category:'travel',eventType:'Relocation',datePrecision:'date_range',eventDate:'2020-03-21',endDate:'2020-06-30',description:'Lockdown village stay — 3-4 months, did nothing productive.',importance:'medium'}),
  ev({id:'evt_bought_car',category:'property',eventType:'Property purchase',datePrecision:'exact_date',eventDate:'2025-11-17',description:'Bought car — old car purchased. First vehicle ownership.',importance:'high'}),
  ev({id:'evt_school_crush',category:'other',eventType:'Romantic interest',datePrecision:'date_range',eventDate:'2015-03-01',endDate:'2015-07-31',description:'School crush — liked a girl, she got married that same year.',importance:'medium'}),
  ev({id:'evt_college_crush',category:'other',eventType:'Romantic interest',datePrecision:'year_range',eventDate:'2017',endDate:'2018',description:'College crush — liked a girl who already had a boyfriend.',importance:'medium'}),
  ev({id:'evt_neighbour_crush',category:'other',eventType:'Romantic interest',datePrecision:'date_range',eventDate:'2018-11-01',endDate:'2020-12-31',description:'Neighbourhood crush — never talked to her.',importance:'low'}),
  ev({id:'evt_nepal_girl',category:'other',eventType:'Romantic interest',datePrecision:'date_range',eventDate:'2022-10-01',endDate:'2023-12-31',description:'Nepal girl love story — met at PM Modi event. Medical student. Confessed, politely denied.',importance:'critical'}),
  ev({id:'evt_unproductive',category:'other',eventType:'Life transition',datePrecision:'date_range',eventDate:'2020-07-01',endDate:'2020-10-31',description:'Unproductive period — did nothing productive for months.',importance:'low'}),
];

// ── Run ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`🔐 Re-encrypting with clean secret (${SECRET.length} chars, no \\n)\n`);

  const client = new pg.Client({
    connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  // Re-encrypt birth details
  const setParts: string[] = [];
  for (const [field, plaintext] of Object.entries(BIRTH)) {
    const enc = crypto.encrypt(plaintext, UID);
    setParts.push(`"${field}" = '${enc.replace(/'/g, "''")}'`);
    console.log(`  ✅ ${field}: re-encrypted`);
  }

  // Encrypt + inject life events
  const leJson = JSON.stringify(events);
  const leEnc = crypto.encrypt(leJson, UID);
  setParts.push(`"lifeEvents" = '${leEnc.replace(/'/g, "''")}'`);
  console.log(`  ✅ lifeEvents: ${events.length} events → ${leEnc.length} chars`);

  // Verify round-trip
  const decLe = JSON.parse(crypto.decrypt(leEnc, UID));
  console.log(`  ✅ Round-trip: ${decLe.length} events\n`);

  // UPDATE DB
  await client.query(
    `UPDATE sessions SET ${setParts.join(', ')}, "updatedAt" = NOW() WHERE id = $1`,
    [SID]
  );

  // FINAL VERIFY
  const vRes = await client.query(`SELECT "fullName", "lifeEvents" FROM sessions WHERE id = $1`, [SID]);
  const v = vRes.rows[0];
  console.log(`  🔍 DB fullName: "${crypto.decrypt(v.fullName, UID)}"`);
  console.log(`  🔍 DB lifeEvents: ${JSON.parse(crypto.decrypt(v.lifeEvents, UID)).length} events`);
  console.log('\n🎉 Done! All data re-encrypted cleanly.');

  await client.end();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
