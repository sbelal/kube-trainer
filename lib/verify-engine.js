/**
 * Kube-Trainer Verification Engine
 *
 * Core engine that loads phase checks and runs them sequentially.
 * Zero external dependencies — uses only Node.js built-ins.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ── ANSI Color Helpers ──────────────────────────────────────────────────────

const color = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
  dim: (text) => `\x1b[2m${text}\x1b[0m`,
};

const PASS = color.green('✅');
const FAIL = color.red('❌');
const ARROW = color.dim('↳');
const LINE = '━'.repeat(58);

// ── Phase Discovery ─────────────────────────────────────────────────────────

/**
 * Find the phase folder matching the given phase number.
 * Scans the `phases/` directory for folders starting with the zero-padded number.
 *
 * @param {number} phaseNumber
 * @returns {{ phasePath: string, phaseName: string }}
 */
function resolvePhase(phaseNumber) {
  const phasesDir = path.join(__dirname, '..', 'phases');

  if (!fs.existsSync(phasesDir)) {
    throw new Error(`Phases directory not found at: ${phasesDir}`);
  }

  const prefix = String(phaseNumber).padStart(2, '0') + '-';
  const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
  const match = entries.find(
    (entry) => entry.isDirectory() && entry.name.startsWith(prefix)
  );

  if (!match) {
    const available = entries
      .filter((e) => e.isDirectory())
      .map((e) => `  • ${e.name}`)
      .join('\n');

    throw new Error(
      `Phase ${phaseNumber} not found.\n\nAvailable phases:\n${available || '  (none)'}`
    );
  }

  // Derive a human-readable name from the folder name
  // e.g. "01-foundations-and-setup" → "Foundations And Setup"
  const phaseName = match.name
    .replace(/^\d+-/, '')
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    phasePath: path.join(phasesDir, match.name),
    phaseName,
    folderName: match.name,
  };
}

// ── Check Loading ───────────────────────────────────────────────────────────

/**
 * Load checks.json from a phase folder.
 *
 * @param {string} phasePath
 * @returns {Array<Object>}
 */
function loadChecks(phasePath) {
  const checksFile = path.join(phasePath, 'checks.json');

  if (!fs.existsSync(checksFile)) {
    throw new Error(`No checks.json found in ${phasePath}`);
  }

  const raw = fs.readFileSync(checksFile, 'utf-8');
  const checks = JSON.parse(raw);

  if (!Array.isArray(checks) || checks.length === 0) {
    throw new Error(`checks.json must be a non-empty array`);
  }

  return checks;
}

// ── Check Execution ─────────────────────────────────────────────────────────

/**
 * Run a single check and return the result.
 *
 * @param {Object} check - A check definition from checks.json
 * @returns {{ passed: boolean, output: string, error: string }}
 */
function runCheck(check) {
  if (check.type === 'command' || check.type === 'script') {
    return runCommandCheck(check);
  }

  return {
    passed: false,
    output: '',
    error: `Unknown check type: "${check.type}"`,
  };
}

/**
 * Execute a command-based check.
 */
function runCommandCheck(check) {
  let command = check.command;

  // For script type, resolve the script path relative to the phase folder
  if (check.type === 'script' && check.scriptPath) {
    command = check.scriptPath;
  }

  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      timeout: 30000, // 30 second timeout per check
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });

    const expect = check.expect || { exitCode: 0 };

    // Check output constraints
    if (expect.outputContains) {
      if (!output.includes(expect.outputContains)) {
        return {
          passed: false,
          output,
          error: `Output does not contain: "${expect.outputContains}"`,
        };
      }
    }

    if (expect.outputMatches) {
      const regex = new RegExp(expect.outputMatches);
      if (!regex.test(output)) {
        return {
          passed: false,
          output,
          error: `Output does not match pattern: ${expect.outputMatches}`,
        };
      }
    }

    return { passed: true, output, error: '' };
  } catch (err) {
    const expectedExit = (check.expect && check.expect.exitCode) ?? 0;

    // If the command failed but we expected a non-zero exit code
    if (err.status === expectedExit) {
      return { passed: true, output: err.stdout || '', error: '' };
    }

    return {
      passed: false,
      output: err.stdout || '',
      error: err.stderr || err.message || 'Command failed',
    };
  }
}

// ── Reporting ───────────────────────────────────────────────────────────────

/**
 * Print results with pretty formatting.
 *
 * @param {number} phaseNumber
 * @param {string} phaseName
 * @param {string} folderName
 * @param {Array<{ check: Object, result: Object }>} results
 */
function printResults(phaseNumber, phaseName, folderName, results) {
  const passed = results.filter((r) => r.result.passed).length;
  const total = results.length;
  const allPassed = passed === total;

  console.log('');
  console.log(
    `  🔍 ${color.bold(`Verifying Phase ${phaseNumber}: ${phaseName}`)}`
  );
  console.log(`  ${color.dim(LINE)}`);
  console.log('');

  for (const { check, result } of results) {
    if (result.passed) {
      console.log(`  ${PASS} ${check.title}`);
    } else {
      console.log(`  ${FAIL} ${check.title}`);
      if (check.fix) {
        const fixPath = `phases/${folderName}/${check.fix.file}`;
        console.log(`     ${ARROW} ${color.yellow('Fix:')} See ${color.cyan(fixPath)}`);
        if (check.fix.section) {
          console.log(`       ${color.dim(`"${check.fix.section}"`)}`);
        }
      }
    }
  }

  console.log('');
  console.log(`  ${color.dim(LINE)}`);
  console.log(`  Result: ${color.bold(`${passed}/${total}`)} checks passed`);

  if (allPassed) {
    const nextPhase = phaseNumber + 1;
    console.log(
      `  Status: ${color.green(`✅ PHASE ${phaseNumber} COMPLETE`)} — you're ready for Phase ${nextPhase}!`
    );
  } else {
    console.log(
      `  Status: ${color.red('❌ INCOMPLETE')} — fix the issues above and re-run`
    );
  }

  console.log('');

  return allPassed;
}

// ── Main Engine ─────────────────────────────────────────────────────────────

/**
 * Run all checks for a given phase number.
 *
 * @param {number} phaseNumber
 * @returns {boolean} true if all checks passed
 */
function verifyPhase(phaseNumber) {
  const { phasePath, phaseName, folderName } = resolvePhase(phaseNumber);
  const checks = loadChecks(phasePath);

  const results = [];
  for (const check of checks) {
    const result = runCheck(check);
    results.push({ check, result });
  }

  return printResults(phaseNumber, phaseName, folderName, results);
}

module.exports = { verifyPhase, resolvePhase, loadChecks, runCheck };
