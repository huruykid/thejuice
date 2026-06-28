#!/usr/bin/env node
/**
 * Design-token guardrail.
 *
 * Fails (exit 1) if any banned, off-system styling pattern appears in src/.
 * These are the exact drift patterns the design audit found — they have
 * semantic-token replacements and zero legitimate uses, so we block them
 * at CI time instead of catching them by eye before each Publish.
 *
 *   • text/bg/border-juice-orange|pink|blue  → use --primary tokens
 *   • bg-clip-text text-transparent wordmark → use solid text-primary
 *
 * Run:  node scripts/check-design-tokens.mjs   (or: npm run design:check)
 *
 * Note: text-white and bare red-/green-/amber- shades are intentionally NOT
 * banned here — they have legitimate uses on image/camera overlays and dark
 * surfaces, and a noisy guard gets disabled. Keep this high-signal.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = new URL("../src", import.meta.url).pathname;
const EXTS = new Set([".ts", ".tsx"]);

const RULES = [
  {
    re: /\b(?:text|bg|border|from|via|to|ring|fill|stroke|divide)-juice-(?:orange|pink|blue)\b/,
    msg: "off-system color class (juice-orange|pink|blue) — use semantic --primary tokens",
  },
  {
    re: /bg-clip-text[^"'`]*text-transparent|text-transparent[^"'`]*bg-clip-text/,
    msg: "gradient-clip wordmark — use solid text-primary instead",
  },
];

/** @param {string} dir */
function walk(dir) {
  /** @type {string[]} */
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (EXTS.has(extname(p))) out.push(p);
  }
  return out;
}

const violations = [];
for (const file of walk(ROOT)) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const rule of RULES) {
      if (rule.re.test(line)) {
        violations.push(`${file.replace(ROOT, "src")}:${i + 1}  ${rule.msg}\n    ${line.trim()}`);
      }
    }
  });
}

if (violations.length) {
  console.error(`\n✖ Design-token guardrail: ${violations.length} violation(s)\n`);
  console.error(violations.join("\n\n"));
  console.error("\nReplace with semantic tokens (see DESIGN_AUDIT.md). To bypass intentionally, refactor the markup — do not weaken this rule.\n");
  process.exit(1);
}

console.log("✓ Design-token guardrail: clean");
