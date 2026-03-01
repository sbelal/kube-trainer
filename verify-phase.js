#!/usr/bin/env node

/**
 * Kube-Trainer: Phase Verification CLI
 *
 * Usage:
 *   node verify-phase.js <phase-number>
 *   npm run verify -- <phase-number>
 *
 * Example:
 *   node verify-phase.js 1
 */

const { verifyPhase } = require('./lib/verify-engine');

// ── ANSI helpers (duplicated here for the usage message) ────────────────────
const bold = (t) => `\x1b[1m${t}\x1b[0m`;
const dim = (t) => `\x1b[2m${t}\x1b[0m`;
const cyan = (t) => `\x1b[36m${t}\x1b[0m`;

function printUsage() {
    console.log('');
    console.log(bold('  🧊 Kube-Trainer — Phase Verification'));
    console.log('');
    console.log(`  ${dim('Usage:')}  node verify-phase.js ${cyan('<phase-number>')}`);
    console.log(`  ${dim('Example:')} node verify-phase.js 1`);
    console.log('');
    console.log(
        `  Runs the verification checks for the specified phase and reports`
    );
    console.log(`  which objectives have been completed.`);
    console.log('');
}

// ── Parse Arguments ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
}

const phaseNumber = parseInt(args[0], 10);

if (isNaN(phaseNumber) || phaseNumber < 0) {
    console.error(`\n  ❌ Invalid phase number: "${args[0]}"\n`);
    console.error(`  Phase number must be a non-negative integer (e.g., 0, 1, 2).\n`);
    process.exit(1);
}

// ── Run Verification ────────────────────────────────────────────────────────

try {
    const allPassed = verifyPhase(phaseNumber);
    process.exit(allPassed ? 0 : 1);
} catch (err) {
    console.error(`\n  ❌ ${err.message}\n`);
    process.exit(1);
}
