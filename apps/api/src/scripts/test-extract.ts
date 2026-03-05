import { extractBatchSurvivors, extractFinalVerdict } from '../lib/btr/extractors/ai-response-extractors.js';

const mockAiBatch = `
Here is my analysis:
[A lot of text]

<FINAL_SCORES>
[
  { "time": "14:35:22", "score": 92, "reason": "Terminal D150 match with exact Dasha" },
  { "time": "10:30:00", "score": 55, "reason": "Failed D60 alignment" }
]
</FINAL_SCORES>

TOP_SURVIVORS: 14:35:22
`;

const survivors = extractBatchSurvivors(mockAiBatch, ["14:35:22", "10:30:00", "01:00:00"], 2);
console.log("Survivors:", survivors);

const mockAiFinal = `
<FINAL_VERDICT>
{
  "time": "14:35:22",
  "accuracy": 95,
  "confidence": "HIGH",
  "margin": 15
}
</FINAL_VERDICT>
`;

const verdict = extractFinalVerdict(mockAiFinal);
console.log("Verdict:", verdict);
