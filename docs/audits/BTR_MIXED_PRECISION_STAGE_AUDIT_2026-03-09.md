# BTR Mixed Precision Stage Audit (2026-03-09)

- stage2: prompts=39, batches=39, candidates(min-max)=0-0
- stage4: prompts=22, batches=22, candidates(min-max)=0-0
- stage6: prompts=26, batches=26, candidates(min-max)=0-0

## Validation Rules
- Every Stage 2/4/6 batch prompt must include all mixed-precision event types
- Every Stage 2/4/6 batch prompt must include all expected event windows
- Every Stage 2/4/6 batch prompt must preserve exact event-time tokens for exact-date-time inputs
- Every Stage 2/4/6 batch prompt must include VSL payload markers: #V|, #K|, #D|

## Result
- PASS

See JSON details: `/home/jovyan/ai-pandit-app/docs/audits/BTR_MIXED_PRECISION_STAGE_AUDIT_2026-03-09.json`
