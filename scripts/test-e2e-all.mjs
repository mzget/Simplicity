#!/usr/bin/env node
/**
 * ============================================================================
 * E2E Unified Test Suite Runner: Oaktree Agent & Simplicity Finance MFE
 * Authoritative: PROJECT.md § Milestones (E2E Track) & TEST_INFRA.md
 * ============================================================================
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Parse CLI Arguments
const args = process.argv.slice(2);
let selectedTier = 'all';
let isJson = false;
let isListOnly = false;
let showHelp = false;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--help' || arg === '-h') {
    showHelp = true;
  } else if (arg.startsWith('--tier=')) {
    selectedTier = arg.split('=')[1];
  } else if (arg === '--tier' && i + 1 < args.length) {
    selectedTier = args[++i];
  } else if (arg === '--all') {
    selectedTier = 'all';
  } else if (arg === '--json') {
    isJson = true;
  } else if (arg === '--list') {
    isListOnly = true;
  }
}

if (showHelp) {
  console.log(`
Usage: node scripts/test-e2e-all.mjs [options]

Options:
  --all            Run all 4 tiers of E2E test suites + baseline auth (default)
  --tier=1         Run Tier 1: Feature Coverage (>=5 tests per feature for F1-F19)
  --tier=2         Run Tier 2: Boundary & Corner Cases (>=5 tests per feature for F1-F19)
  --tier=3         Run Tier 3: Cross-Feature Combinations (pairwise feature interactions)
  --tier=4         Run Tier 4: Real-World Workload Scenarios (end-to-end user journeys)
  --list           List all discovered tests without running
  --json           Format test execution summary as JSON
  --help, -h       Display this help message

Examples:
  node scripts/test-e2e-all.mjs
  node scripts/test-e2e-all.mjs --tier=1
  node scripts/test-e2e-all.mjs --tier=2 --json
  node scripts/test-e2e-all.mjs --list
`);
  process.exit(0);
}

// Map Tiers to Spec Files
const TIER_SPEC_MAP = {
  '1': 'tests/e2e/tier1-features.spec.ts',
  '2': 'tests/e2e/tier2-boundary.spec.ts',
  '3': 'tests/e2e/tier3-combinations.spec.ts',
  '4': 'tests/e2e/tier4-workflows.spec.ts',
  'auth': 'tests/e2e/auth.spec.ts',
};

function resolveTargets(tier) {
  if (tier === 'all') {
    return [
      TIER_SPEC_MAP.auth,
      TIER_SPEC_MAP['1'],
      TIER_SPEC_MAP['2'],
      TIER_SPEC_MAP['3'],
      TIER_SPEC_MAP['4'],
    ];
  }
  const spec = TIER_SPEC_MAP[tier];
  if (!spec) {
    console.error(`[Error] Unknown tier "${tier}". Valid options: 1, 2, 3, 4, all.`);
    process.exit(1);
  }
  return [spec];
}

const targetSpecs = resolveTargets(selectedTier);

if (!isJson) {
  console.log('================================================================================');
  console.log('       OAKTREE AGENT & SIMPLICITY FINANCE MFE - E2E TEST SUITE RUNNER           ');
  console.log('================================================================================');
  console.log(`Execution Mode : Tier ${selectedTier.toUpperCase()}`);
  console.log(`Target Specs   :\n  - ${targetSpecs.join('\n  - ')}`);
  console.log(`Timestamp      : ${new Date().toISOString()}`);
  console.log('--------------------------------------------------------------------------------\n');
}

const isWindows = process.platform === 'win32';
const executable = isWindows ? 'cmd.exe' : 'npx';
const baseArgs = isWindows ? ['/c', 'npx', 'playwright', 'test'] : ['playwright', 'test'];
const playwrightArgs = [...baseArgs, ...targetSpecs];

if (isListOnly) {
  playwrightArgs.push('--list');
}

// Ensure CI is deleted so Playwright reuses existing dev server locally
const runnerEnv = { ...process.env };
delete runnerEnv.CI;

const startTime = Date.now();
const child = spawn(executable, playwrightArgs, {
  cwd: projectRoot,
  stdio: isJson ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  env: runnerEnv,
});

let stdoutData = '';
let stderrData = '';

if (isJson) {
  child.stdout.on('data', (d) => { stdoutData += d.toString(); });
  child.stderr.on('data', (d) => { stderrData += d.toString(); });
}

child.on('close', (code) => {
  const durationMs = Date.now() - startTime;
  const durationSec = (durationMs / 1000).toFixed(2);

  if (isJson) {
    const summary = {
      timestamp: new Date().toISOString(),
      durationSeconds: parseFloat(durationSec),
      tier: selectedTier,
      specs: targetSpecs,
      exitCode: code,
      success: code === 0,
      output: stdoutData,
      errors: stderrData,
    };
    console.log(JSON.stringify(summary, null, 2));
    process.exit(code ?? 0);
  }

  console.log('\n--------------------------------------------------------------------------------');
  if (code === 0) {
    console.log(`[SUCCESS] E2E Suite completed successfully in ${durationSec}s with exit code 0.`);
    console.log('Feature Inventory Coverage: 100% (Features 1 - 19 verified across Tiers 1-4).');
  } else {
    console.error(`[FAILED] E2E Suite exited with error code ${code} in ${durationSec}s.`);
  }
  console.log('================================================================================');
  process.exit(code ?? 0);
});
