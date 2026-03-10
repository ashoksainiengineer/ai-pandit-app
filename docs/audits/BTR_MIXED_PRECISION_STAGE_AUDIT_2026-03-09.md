# BTR Mixed Precision Stage Audit (2026-03-09)

- stage2: prompts=52, batches=52, candidates(min-max)=1-6
- stage4: prompts=20, batches=20, candidates(min-max)=1-6
- stage6: prompts=26, batches=26, candidates(min-max)=2-6

## Validation Rules
- Every Stage 2/4/6 batch prompt must include all mixed-precision event types
- Every Stage 2/4/6 batch prompt must include all expected event windows
- Every Stage 2/4/6 batch prompt must preserve exact event-time tokens for exact-date-time inputs
- Every Stage 2/4/6 batch prompt must include VSL payload markers: #V|, #N|, #K|, #H|, #D|, #T|

## Result
- PASS

See JSON details: `/home/ashoksainiengineer/Desktop/ai-pandit/ai-pandit/docs/audits/BTR_MIXED_PRECISION_STAGE_AUDIT_2026-03-09.json`
