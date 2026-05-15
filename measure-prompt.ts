import { getBatchPrompt } from './apps/api/src/lib/btr/prompts/batch-prompt.js';
import { getDeepAnalysisPrompt } from './apps/api/src/lib/btr/prompts/deep-analysis-prompt.js';
import { getFinalPrecisionPrompt } from './apps/api/src/lib/btr/prompts/final-precision-prompt.js';

// Create a realistic candidate with all fields populated
function createMockCandidate(time: string): any {
  return {
    time,
    planets: {
      sun: { sign: 'Aries', degree: 15.5, nakshatra: 'Bharani', house: 1, dignity: 'Exalted', isRetro: false, shadbala: 1.2, functionalNature: { role: 'Benefic' }, avastha: 'Kumara', longitude: 15.5, speed: 0.98, isCombust: false, compoundDignity: 'Exalted in D1', aspects: [{ planet: 'moon', type: 'Trine' }] },
      moon: { sign: 'Taurus', degree: 22.3, nakshatra: 'Rohini', house: 2, dignity: 'Own', isRetro: false, shadbala: 1.5, functionalNature: { role: 'Benefic' }, avastha: 'Yuva', longitude: 52.3, speed: 13.2, isCombust: false, compoundDignity: 'Own sign', aspects: [] },
      mars: { sign: 'Gemini', degree: 8.7, nakshatra: 'Mrigashira', house: 3, dignity: 'Neutral', isRetro: false, shadbala: 0.9, functionalNature: { role: 'Malefic' }, avastha: 'Kumara', longitude: 68.7, speed: 0.5, isCombust: false, compoundDignity: 'Neutral', aspects: [{ planet: 'venus', type: 'Square' }] },
      mercury: { sign: 'Cancer', degree: 3.2, nakshatra: 'Punarvasu', house: 4, dignity: 'Debilitated', isRetro: true, shadbala: 0.7, functionalNature: { role: 'Neutral' }, avastha: 'Bala', longitude: 93.2, speed: -0.2, isCombust: false, compoundDignity: 'Debilitated', aspects: [] },
      jupiter: { sign: 'Leo', degree: 18.9, nakshatra: 'Purva Phalguni', house: 5, dignity: 'Friendly', isRetro: false, shadbala: 1.1, functionalNature: { role: 'Benefic' }, avastha: 'Yuva', longitude: 138.9, speed: 0.08, isCombust: false, compoundDignity: 'Friendly', aspects: [{ planet: 'sun', type: 'Trine' }] },
      venus: { sign: 'Virgo', degree: 5.4, nakshatra: 'Uttara Phalguni', house: 6, dignity: 'Debilitated', isRetro: false, shadbala: 0.8, functionalNature: { role: 'Benefic' }, avastha: 'Kumara', longitude: 155.4, speed: 1.2, isCombust: false, compoundDignity: 'Debilitated', aspects: [] },
      saturn: { sign: 'Libra', degree: 28.1, nakshatra: 'Vishakha', house: 7, dignity: 'Exalted', isRetro: false, shadbala: 1.3, functionalNature: { role: 'Malefic' }, avastha: 'Vriddha', longitude: 178.1, speed: 0.03, isCombust: false, compoundDignity: 'Exalted', aspects: [{ planet: 'mars', type: 'Opposition' }] },
      rahu: { sign: 'Scorpio', degree: 12.0, nakshatra: 'Anuradha', house: 8, dignity: 'Neutral', isRetro: true, shadbala: 0.6, functionalNature: { role: 'Malefic' }, avastha: 'Yuva', longitude: 222.0, speed: -0.05, isCombust: false, compoundDignity: 'Neutral', aspects: [] },
      ketu: { sign: 'Taurus', degree: 12.0, nakshatra: 'Rohini', house: 2, dignity: 'Neutral', isRetro: true, shadbala: 0.6, functionalNature: { role: 'Malefic' }, avastha: 'Yuva', longitude: 42.0, speed: -0.05, isCombust: false, compoundDignity: 'Neutral', aspects: [] }
    },
    ascendant: { sign: 'Aries', degree: 15.5, nakshatra: 'Bharani' },
    ayanamsa: 24.1256,
    panchanga: { tithi: 'Shukla Pratipada', yoga: 'Viskumbha', karana: 'Kinstughna', vara: 'Sunday', nakshatra: 'Ashwini' },
    vedicSignals: { tatwa: { element: 'Fire' }, kundaLagna: { matchesMoon: true }, charaKarakas: [{ karakaName: 'Atmakaraka', planet: 'sun' }, { karakaName: 'Amatyakaraka', planet: 'jupiter' }, { karakaName: 'Darakaraka', planet: 'venus' }], vargottama: [{ planet: 'sun', varga: 'D9' }], pushkar: [{ planet: 'moon', varga: 'D9' }] },
    houseLords: { '1': 'Mars', '2': 'Venus', '3': 'Mercury', '4': 'Moon', '5': 'Sun', '6': 'Mercury', '7': 'Venus', '8': 'Mars', '9': 'Jupiter', '10': 'Saturn', '11': 'Saturn', '12': 'Jupiter' },
    vimsopakaBala: { sun: 12, moon: 15, mars: 8, mercury: 6, jupiter: 14, venus: 7, saturn: 13, rahu: 5, ketu: 5 },
    vargaDegrees: {
      D9: { Ascendant: 'Aries 15.5', Sun: 'Leo 5.2', Moon: 'Capricorn 8.3', Venus: 'Pisces 12.1', Jupiter: 'Sagittarius 18.9', Saturn: 'Libra 28.1', Rahu: 'Cancer 2.0', Ketu: 'Capricorn 2.0' },
      D10: { Ascendant: 'Taurus 3.1', Sun: 'Virgo 15.2', Moon: 'Aquarius 22.3', Venus: 'Aries 8.4', Jupiter: 'Capricorn 1.2', Saturn: 'Scorpio 8.7', Rahu: 'Leo 12.0', Ketu: 'Aquarius 12.0' },
      D12: { Ascendant: 'Gemini 18.5', Sun: 'Libra 2.3', Moon: 'Pisces 15.6', Venus: 'Taurus 22.1', Jupiter: 'Aquarius 5.4', Saturn: 'Sagittarius 11.2', Rahu: 'Virgo 18.0', Ketu: 'Pisces 18.0' },
      D60: { Ascendant: 'Cancer 8.2', Sun: 'Scorpio 20.1', Moon: 'Aries 3.4', Venus: 'Gemini 15.7', Jupiter: 'Pisces 22.8', Saturn: 'Capricorn 5.3', Rahu: 'Libra 11.0', Ketu: 'Aries 11.0' },
      D150: { Ascendant: 'Leo 12.5', Sun: 'Sagittarius 2.8', Moon: 'Taurus 18.9', Venus: 'Cancer 8.1', Jupiter: 'Aries 15.2', Saturn: 'Aquarius 22.4', Rahu: 'Scorpio 5.0', Ketu: 'Taurus 5.0' }
    },
    d60Planets: { sun: { deity: 'Shiva' }, moon: { deity: 'Parvati' }, mars: { deity: 'Skanda' }, mercury: { deity: 'Vishnu' }, jupiter: { deity: 'Brahma' }, venus: { deity: 'Indra' }, saturn: { deity: 'Yama' }, rahu: { deity: 'Serpent' }, ketu: { deity: 'Tail' } },
    ashtakavarga: { sun: [3,2,3,4,3,2,3,4,3,2,3,4], moon: [4,3,4,3,4,3,4,3,4,3,4,3], mars: [3,4,3,2,3,4,3,2,3,4,3,2], mercury: [2,3,2,3,2,3,2,3,2,3,2,3], jupiter: [4,4,4,3,4,4,4,3,4,4,4,3], venus: [3,3,3,4,3,3,3,4,3,3,3,4], saturn: [2,2,3,2,2,3,2,2,3,2,2,3], rahu: [3,3,3,3,3,3,3,3,3,3,3,3], ketu: [3,3,3,3,3,3,3,3,3,3,3,3] },
    nadiData: { ascendant: { index: 1, nadiMode: 'Movable', kala: 'Vipra', nadiName: 'Prathama', deity: 'Agni', karmicSignificance: 'Spiritual', phala: 'Success', timeResolution: 48 }, sun: { index: 15, nadiMode: 'Fixed', kala: 'Kshatriya', nadiName: 'Dvitiya', deity: 'Surya', karmicSignificance: 'Career', phala: 'Power', timeResolution: 48 }, moon: { index: 28, nadiMode: 'Dual', kala: 'Vaishya', nadiName: 'Tritiya', deity: 'Chandra', karmicSignificance: 'Relation', phala: 'Emotion', timeResolution: 48 } },
    kpData: { planetSubLords: { sun: { starLord: 'Venus', subLord: 'Saturn', subSubLord: 'Jupiter', subSubSubLord: 'Mars' }, moon: { starLord: 'Mars', subLord: 'Venus', subSubLord: 'Saturn', subSubSubLord: 'Jupiter' }, mars: { starLord: 'Rahu', subLord: 'Ketu', subSubLord: 'Mercury', subSubSubLord: 'Venus' }, mercury: { starLord: 'Jupiter', subLord: 'Mars', subSubLord: 'Rahu', subSubSubLord: 'Ketu' }, jupiter: { starLord: 'Saturn', subLord: 'Sun', subSubLord: 'Moon', subSubSubLord: 'Mars' }, venus: { starLord: 'Mercury', subLord: 'Jupiter', subSubLord: 'Saturn', subSubSubLord: 'Sun' }, saturn: { starLord: 'Moon', subLord: 'Rahu', subSubLord: 'Ketu', subSubSubLord: 'Mercury' }, rahu: { starLord: 'Ketu', subLord: 'Mercury', subSubLord: 'Venus', subSubSubLord: 'Saturn' }, ketu: { starLord: 'Mercury', subLord: 'Venus', subSubLord: 'Saturn', subSubSubLord: 'Jupiter' } }, cuspalSubLords: { '1': { sign: 'Aries', starLord: 'Venus', subLord: 'Saturn', subSubLord: 'Jupiter' }, '2': { sign: 'Taurus', starLord: 'Mars', subLord: 'Venus', subSubLord: 'Saturn' }, '3': { sign: 'Gemini', starLord: 'Rahu', subLord: 'Ketu', subSubLord: 'Mercury' }, '4': { sign: 'Cancer', starLord: 'Jupiter', subLord: 'Mars', subSubLord: 'Rahu' }, '5': { sign: 'Leo', starLord: 'Saturn', subLord: 'Sun', subSubLord: 'Moon' }, '6': { sign: 'Virgo', starLord: 'Mercury', subLord: 'Jupiter', subSubLord: 'Saturn' }, '7': { sign: 'Libra', starLord: 'Moon', subLord: 'Rahu', subSubLord: 'Ketu' }, '8': { sign: 'Scorpio', starLord: 'Ketu', subLord: 'Mercury', subSubLord: 'Venus' }, '9': { sign: 'Sagittarius', starLord: 'Mercury', subLord: 'Venus', subSubLord: 'Saturn' }, '10': { sign: 'Capricorn', starLord: 'Venus', subLord: 'Saturn', subSubLord: 'Jupiter' }, '11': { sign: 'Aquarius', starLord: 'Mars', subLord: 'Venus', subSubLord: 'Saturn' }, '12': { sign: 'Pisces', starLord: 'Rahu', subLord: 'Ketu', subSubLord: 'Mercury' } } },
    vimshottariDasha: [{ maha: 'Sun', antar: 'Moon', pratyantar: 'Mars', sukshma: 'Rahu', prana: 'Jupiter', startEnd: '1990-01-01 to 1990-06-15' }, { maha: 'Moon', antar: 'Mars', pratyantar: 'Rahu', sukshma: 'Jupiter', prana: 'Saturn', startEnd: '1990-06-15 to 1991-01-01' }],
    yoginiDasha: [{ lord: 'Moon', startDate: new Date('1990-01-01'), endDate: new Date('1995-01-01') }],
    charaDasha: [{ sign: 'Aries', startDate: new Date('1990-01-01'), endDate: new Date('1995-01-01') }],
    kalachakraDasha: [{ lord: 'Sun', sign: 'Leo', startDate: new Date('1990-01-01'), endDate: new Date('1995-01-01') }],
    transitData: { '2020-01-01': { doubleTransit: { isTriggered: true }, dasha: 'Jupiter-Saturn-Mars', signatures: ['Career Rise', 'Foreign Travel'], planets: { Jupiter: 'Sagittarius', Saturn: 'Capricorn', Mars: 'Aries', Rahu: 'Gemini', Ketu: 'Sagittarius' } }, '2021-06-15': { doubleTransit: { isTriggered: false }, dasha: 'Saturn-Mercury-Venus', signatures: ['Health Issue'], planets: { Jupiter: 'Aquarius', Saturn: 'Capricorn', Mars: 'Leo', Rahu: 'Taurus', Ketu: 'Scorpio' } } },
    spouseMatch: { lagnaMatch: true, moonMatch: false, score: 72, reason: 'D9 lagna compatible but moon signs differ' },
    spouseD9Verification: { isMatch: true, score: 68, reason: '7th lord well placed in D9' },
    sandhiZones: [{ type: 'Lagna', degree: 15.5 }],
    gandantaAnalysis: { isGandanta: false, severity: 'none' },
    d60Sign: 'Cancer',
    d150Sign: 'Leo',
    chalitDiscrepancies: [{ planet: 'sun', rashiHouse: 1, chalitHouse: 12 }, { planet: 'moon', rashiHouse: 2, chalitHouse: 1 }],
    pakshiAnalysis: { rulingBird: { name: 'Owl' }, birdStrength: 'Strong', activityStrengths: ['Day', 'Night'] },
    specialPoints: { arudhaLagna: { sign: 'Leo', degree: 15.5 }, upapadaLagna: { sign: 'Libra', degree: 8.2 }, bhriguBindu: { sign: 'Scorpio', degree: 22.1 } },
    precision: { consensus: { overallConsensus: 85, confidenceLevel: 'HIGH', marginOfError: 15, redFlags: { sandhiBirth: false, gandanta: false, dashaSandhi: false, conflictingMethods: false, weakSignificators: false, d60Instability: false } }, kpSubLords: { sun: { starLord: 'Venus', subLord: 'Saturn', subSubLord: 'Jupiter', subSubSubLord: 'Mars' } }, cuspalSubLords: { '1': { sign: 'Aries', starLord: 'Venus', subLord: 'Saturn', subSubLord: 'Jupiter' } } },
    ishtaKashtaPhala: { sun: { ishta: 12, kashta: 8 }, moon: { ishta: 15, kashta: 5 } },
    aiScore: 82,
    moonNakshatra: 'Rohini'
  };
}

const mockEvents = [
  { id: '1', date: '2010-06-15', eventType: 'Graduated college', description: 'Completed B.Tech from IIT', importance: 'high', category: 'education' },
  { id: '2', date: '2015-03-20', eventType: 'Started first job', description: 'Joined Google as SDE', importance: 'critical', category: 'career' },
  { id: '3', date: '2018-11-10', eventType: 'Marriage', description: 'Married college sweetheart', importance: 'critical', category: 'marriage' }
];

// Stage 2: 8 candidates per batch
const stage2Candidates = Array.from({ length: 8 }, (_, i) => createMockCandidate(`12:${String(i * 5).padStart(2, '0')}:00`));
const stage2Prompt = getBatchPrompt(stage2Candidates, mockEvents, 1, 38, 50, null, 60);

// Stage 4: 3-5 finalists
const stage4Candidates = Array.from({ length: 4 }, (_, i) => createMockCandidate(`12:${String(i * 5).padStart(2, '0')}:00`));
const stage4Prompt = getDeepAnalysisPrompt(stage4Candidates, mockEvents, null, 60);

// Stage 6: 2-3 finalists
const stage6Candidates = Array.from({ length: 3 }, (_, i) => createMockCandidate(`12:${String(i * 5).padStart(2, '0')}:00`));
const stage6Prompt = getFinalPrecisionPrompt(stage6Candidates, mockEvents, null);

function measure(prompt: string, name: string) {
  const chars = prompt.length;
  const bytes = Buffer.byteLength(prompt, 'utf8');
  // Rough token estimate: ~1 token per 4 chars for English text, ~1 per 3 for code/symbols
  const tokensApprox = Math.ceil(chars / 3.5);
  console.log(`\n=== ${name} ===`);
  console.log(`Characters: ${chars.toLocaleString()}`);
  console.log(`Bytes (UTF-8): ${bytes.toLocaleString()}`);
  console.log(`Approx Tokens (chars/3.5): ${tokensApprox.toLocaleString()}`);
  console.log(`Approx Tokens (chars/4): ${Math.ceil(chars / 4).toLocaleString()}`);
  console.log(`First 500 chars:\n${prompt.slice(0, 500)}`);
  console.log(`\n...Last 500 chars:\n${prompt.slice(-500)}`);
}

measure(stage2Prompt, 'STAGE 2 (Batch Prompt - 8 candidates)');
measure(stage4Prompt, 'STAGE 4 (Deep Analysis - 4 candidates)');
measure(stage6Prompt, 'STAGE 6 (Final Precision - 3 candidates)');

console.log('\n=== SUMMARY ===');
console.log('Groq openai/gpt-oss-120b limit: 8,000 TPM (tokens per minute)');
console.log('Stage 2 with 8 candidates: ~' + Math.ceil(stage2Prompt.length / 3.5).toLocaleString() + ' tokens');
console.log('Stage 4 with 4 candidates: ~' + Math.ceil(stage4Prompt.length / 3.5).toLocaleString() + ' tokens');
console.log('Stage 6 with 3 candidates: ~' + Math.ceil(stage6Prompt.length / 3.5).toLocaleString() + ' tokens');
