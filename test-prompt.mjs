// Simple test without imports
const prompt = `BIRTH TIME RECTIFICATION - STAGE 2 (Batch 1/1)

CANDIDATES WITH ENRICHED VEDIC DATA (VSL Protocol):

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CANDIDATE: 12:00:00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#C
!C|82|H|15|~
#P
!P|Shukla Pratipada|Viskumbha|Kinstughna|Sunday|Ashwini|Fire|KL1
#L
!L|Ar|15.5|Bharani|L1=Ma|MN=Rohini
!M|Su[Ar|H1|Exc|SB1.20|FNBenefic]|Mo[Ta|H2|Own|SB1.50|FNBenefic]
#V|D9[Asc:Ar]|D10[Asc:Ta]
#D|VIM[Su|Mo|1990-01-01 to 1990-06-15]
#K|Su[Ve>Sa]
!SB|Su:1.20|Mo:1.50
#B|AK=Su|AmK=Ju|DK=Ve
!S|Lag=1|Moon=0|Score=72|D9=1|Why=Test
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LIFE EVENTS:
2010-06-15: Graduated (education) [high]
`;

const matches = [...prompt.matchAll(/CANDIDATE:\s*(\d{2}:\d{2}:\d{2})/g)];
console.log('Candidate count:', matches.length);
console.log('Has #V|:', prompt.includes('#V|'));
console.log('Has #K|:', prompt.includes('#K|'));
console.log('Has #D|:', prompt.includes('#D|'));
