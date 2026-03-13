#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const [inputPath = 'logs/test-latest.log', outPrefix = 'logs/test-summary-latest'] = process.argv.slice(2);

if (!fs.existsSync(inputPath)) {
  console.error(`Input log not found: ${inputPath}`);
  process.exit(1);
}

const raw = fs.readFileSync(inputPath, 'utf8');
const lines = raw.split(/\r?\n/);

const firstMatch = (re) => {
  const m = raw.match(re);
  return m ? m.slice(1) : null;
};

const aggregateCounters = (label) => {
  const targetLines = lines.filter((line) => line.includes(label));
  const totals = { passed: 0, failed: 0, skipped: 0, lines: targetLines.length };

  for (const line of targetLines) {
    const matches = [...line.matchAll(/(\d+)\s+(passed|failed|skipped)/g)];
    for (const [, value, status] of matches) {
      totals[status] += Number(value);
    }
  }

  return totals.lines > 0 ? totals : null;
};

const tasks = firstMatch(/Tasks:\s+(\d+)\s+successful,\s+(\d+)\s+total/);
const duration = firstMatch(/Time:\s+([0-9.]+s)/);
const testFiles = aggregateCounters('Test Files');
const tests = aggregateCounters('Tests');
const hasFailure = /\bFAIL\b|Test Files.*\bfailed\b|Tests.*\bfailed\b/.test(raw);

const failureLines = lines
  .filter((line) => /(^|:)\s*FAIL\s|^\s*❯\s/.test(line))
  .slice(0, 50);

const securitySignals = {
  invalidApiKey: /invalid_api_key/i.test(raw),
  dbConnRefused: /ECONNREFUSED\s+127\.0\.0\.1:5432/i.test(raw),
};

const summary = {
  inputPath,
  status: hasFailure ? 'failed' : 'passed',
  tasks: tasks
    ? { successful: Number(tasks[0]), total: Number(tasks[1]) }
    : null,
  duration: duration ? duration[0] : null,
  testFiles,
  tests,
  failureLines,
  securitySignals,
};

const outDir = path.dirname(outPrefix);
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(`${outPrefix}.json`, `${JSON.stringify(summary, null, 2)}\n`);

const md = [
  '# Test Summary',
  '',
  `- Status: **${summary.status.toUpperCase()}**`,
  `- Input log: \`${inputPath}\``,
  summary.duration ? `- Turbo duration: \`${summary.duration}\`` : '- Turbo duration: `n/a`',
  summary.tasks
    ? `- Tasks: \`${summary.tasks.successful}/${summary.tasks.total} successful\``
    : '- Tasks: `n/a`',
  summary.testFiles
    ? `- Test files: \`${summary.testFiles.passed} passed, ${summary.testFiles.failed} failed, ${summary.testFiles.skipped} skipped\``
    : '- Test files: `n/a`',
  summary.tests
    ? `- Tests: \`${summary.tests.passed} passed, ${summary.tests.failed} failed, ${summary.tests.skipped} skipped\``
    : '- Tests: `n/a`',
  '',
  '## Noise/Safety Signals',
  `- invalid_api_key seen: \`${summary.securitySignals.invalidApiKey}\``,
  `- DB ECONNREFUSED(5432) seen: \`${summary.securitySignals.dbConnRefused}\``,
  '',
  '## Failure Excerpts',
  ...(summary.failureLines.length > 0
    ? summary.failureLines.map((line) => `- ${line}`)
    : ['- none']),
  '',
].join('\n');

fs.writeFileSync(`${outPrefix}.md`, `${md}\n`);

console.log(`Wrote ${outPrefix}.json and ${outPrefix}.md`);
