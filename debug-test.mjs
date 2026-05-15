import { getBatchPrompt } from './apps/api/src/lib/btr/prompts/batch-prompt.js';

const mockCandidate = {
  time: '12:00:00',
  planets: {
    sun: { sign: 'Aries', degree: 15.5, nakshatra: 'Bharani', house: 1, dignity: 'Exalted', isRetro: false, shadbala: 1.2, functionalNature: { role: 'Benefic' } },
    moon: { sign: 'Taurus', degree: 22.3, nakshatra: 'Rohini', house: 2, dignity: 'Own', isRetro: false, shadbala: 1.5, functionalNature: { role: 'Benefic' } },
  },
  ascendant: { sign: 'Aries', degree: 15.5, nakshatra: 'Bharani' },
  ayanamsa: 24.1256,
  panchanga: { tithi: 'Shukla Pratipada', yoga: 'Viskumbha', karana: 'Kinstughna', vara: 'Sunday', nakshatra: 'Ashwini' },
  vedicSignals: { tatwa: { element: 'Fire' }, kundaLagna: { matchesMoon: true }, charaKarakas: [{ karakaName: 'Atmakaraka', planet: 'sun' }] },
  houseLords: { '1': 'Mars' },
  vimshottariDasha: [{ maha: 'Sun', antar: 'Moon', pratyantar: 'Mars', startEnd: '1990-01-01 to 1990-06-15' }],
  kpData: { planetSubLords: { sun: { starLord: 'Venus', subLord: 'Saturn', subSubLord: 'Jupiter', subSubSubLord: 'Mars' } } },
  spouseMatch: { lagnaMatch: true, moonMatch: false, score: 72, reason: 'Test' },
  d60Sign: 'Cancer',
  d150Sign: 'Leo',
  aiScore: 82,
  moonNakshatra: 'Rohini'
};

const mockEvents = [{ id: '1', date: '2010-06-15', eventType: 'Graduated', description: 'Test', importance: 'high', category: 'education' }];

try {
  const prompt = getBatchPrompt([mockCandidate], mockEvents, 1, 1, 1, null, 60);
  console.log('Prompt generated successfully');
  console.log('Length:', prompt.length);
  console.log('Has CANDIDATE:', prompt.includes('CANDIDATE:'));
  console.log('Has #V|:', prompt.includes('#V|'));
  console.log('Has #K|:', prompt.includes('#K|'));
  console.log('Has #D|:', prompt.includes('#D|'));
  console.log('Has #N|:', prompt.includes('#N|'));
  console.log('Has #H|:', prompt.includes('#H|'));
  console.log('Has #T|:', prompt.includes('#T|'));
} catch (err) {
  console.error('Error:', err.message);
}
