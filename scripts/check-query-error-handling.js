#!/usr/bin/env node
/**
 * CI guard for the isError-masking regression fixed across 10 screens
 * during the Sprint 6 post-kickoff regression audit (see
 * docs/sprints/sprint-06-decision-engine.md, "Fix 4"): a screen that reads
 * a query's `isLoading` but never checks `isError` renders a failed
 * request identically to "no data yet" - a real request error gets
 * silently presented as an empty state instead of a retriable error.
 *
 * Deliberately script-based, not a custom ESLint rule: zero runtime
 * impact, no new lint infrastructure, trivial to read/modify/remove.
 * Scoped to app/**\/*.tsx (screens) only, matching the exact surface the
 * original audit covered - presentation components receive isLoading as
 * a prop and aren't the ones responsible for owning error handling.
 *
 * Heuristic, not a type-aware check: flags any screen file that contains
 * the identifier `isLoading` without also containing `isError` anywhere
 * in the same file. False positives are possible (e.g. a genuinely
 * error-proof local `isLoading` unrelated to a query) - escape hatch:
 * add `// query-error-guard-ignore: <reason>` anywhere in the file.
 */

const fs = require('fs');
const path = require('path');

const APP_DIR = path.join(__dirname, '..', 'app');
const IGNORE_MARKER = 'query-error-guard-ignore';
const IS_LOADING_RE = /\bisLoading\b/;
const IS_ERROR_RE = /\bisError\b/;

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (entry.isFile() && fullPath.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

function main() {
  if (!fs.existsSync(APP_DIR)) {
    console.error(`check-query-error-handling: app/ directory not found at ${APP_DIR}`);
    process.exit(1);
  }

  const offenders = [];

  for (const file of walk(APP_DIR)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes(IGNORE_MARKER)) continue;
    if (IS_LOADING_RE.test(content) && !IS_ERROR_RE.test(content)) {
      offenders.push(path.relative(process.cwd(), file));
    }
  }

  if (offenders.length > 0) {
    console.error('\nQuery error-handling guard FAILED.');
    console.error('These screens read `isLoading` from a query but never check `isError`,');
    console.error('which silently renders a failed request as an empty state:\n');
    offenders.forEach((f) => console.error(`  - ${f}`));
    console.error(
      '\nFix: destructure and handle `isError` (see any of the 10 screens fixed in the Sprint 6\n' +
        'regression audit for the pattern, e.g. app/(tabs)/goals.tsx).\n' +
        `If this file's \`isLoading\` genuinely isn't from a fallible query, add a\n` +
        `// ${IGNORE_MARKER}: <reason> comment anywhere in the file instead of ignoring this failure.\n`
    );
    process.exit(1);
  }

  console.log(`check-query-error-handling: OK (${walk(APP_DIR).length} screens checked, none missing isError handling).`);
}

main();
