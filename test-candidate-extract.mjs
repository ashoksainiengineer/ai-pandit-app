const prompt = `
CANDIDATE: 12:00:00
Some data
CANDIDATE: 12:05:00
More data
`;

const matches = [...prompt.matchAll(/CANDIDATE:\s*(\d{2}:\d{2}:\d{2})/g)];
console.log('Matches:', matches.length);
console.log('Times:', matches.map(m => m[1]));
