/**
 * Setup GitHub Labels — Jalankan SEKALI untuk membuat semua label standar.
 *
 * Usage:
 *   GITHUB_TOKEN=xxx REPO_OWNER=xxx REPO_NAME=xxx node src/setup-labels.js
 */
import "dotenv/config";
import { Octokit } from "@octokit/rest";
import chalk from "chalk";

const { GITHUB_TOKEN, REPO_OWNER, REPO_NAME } = process.env;
if (!GITHUB_TOKEN || !REPO_OWNER || !REPO_NAME) {
  console.error("❌ Set: GITHUB_TOKEN, REPO_OWNER, REPO_NAME");
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

const LABELS = [
  // Tipe issue
  { name: "bug",              color: "d73a4a", description: "Something is not working" },
  { name: "feature",          color: "a2eeef", description: "New feature or request" },
  { name: "question",         color: "d876e3", description: "Further information is requested" },
  { name: "documentation",    color: "0075ca", description: "Improvements or additions to docs" },
  { name: "chore",            color: "e4e669", description: "Maintenance tasks" },
  { name: "enhancement",      color: "84b6eb", description: "Enhancement to existing feature" },
  // Status
  { name: "needs-more-info",  color: "fef2c0", description: "More information needed" },
  { name: "duplicate",        color: "cfd3d7", description: "Already exists" },
  { name: "wontfix",          color: "ffffff", description: "Will not be worked on" },
  { name: "in-progress",      color: "0e8a16", description: "Currently being worked on" },
  // Prioritas
  { name: "P0-critical",      color: "b60205", description: "P0: Data loss / security / prod down" },
  { name: "P1-high",          color: "e4100a", description: "P1: Core broken, no workaround" },
  { name: "P2-medium",        color: "e99695", description: "P2: Minor bug, workaround exists" },
  { name: "P3-low",           color: "f9d0c4", description: "P3: Nice-to-have / cosmetic" },
  // Ukuran
  { name: "size/XS",          color: "009800", description: "< 10 lines" },
  { name: "size/S",           color: "77bb00", description: "10-50 lines" },
  { name: "size/M",           color: "eebb00", description: "50-200 lines" },
  { name: "size/L",           color: "ee7700", description: "200-500 lines" },
  { name: "size/XL",          color: "ee0000", description: "500+ lines" },
  // Kontributor
  { name: "good-first-issue", color: "7057ff", description: "Good for newcomers" },
  { name: "help-wanted",      color: "008672", description: "Extra attention needed" },
];

const existing = await octokit.paginate(octokit.issues.listLabelsForRepo, {
  owner: REPO_OWNER, repo: REPO_NAME, per_page: 100,
});
const existingMap = new Map(existing.map(l => [l.name, l]));

console.log(chalk.bold.cyan(`\n🏷️  Setting up ${LABELS.length} labels for ${REPO_OWNER}/${REPO_NAME}...\n`));
let created = 0, updated = 0;

for (const label of LABELS) {
  try {
    if (existingMap.has(label.name)) {
      if (existingMap.get(label.name).color !== label.color) {
        await octokit.issues.updateLabel({ owner: REPO_OWNER, repo: REPO_NAME, ...label });
        console.log(chalk.yellow(`  ✏️  Updated:  ${label.name}`)); updated++;
      }
    } else {
      await octokit.issues.createLabel({ owner: REPO_OWNER, repo: REPO_NAME, ...label });
      console.log(chalk.green(`  ✅ Created:  ${label.name}`)); created++;
    }
  } catch (e) {
    console.log(chalk.red(`  ❌ Failed:   ${label.name} — ${e.message}`));
  }
}

console.log(chalk.bold(`\n✅ Done! Created: ${created}, Updated: ${updated}`));
console.log(chalk.dim(`🔗 https://github.com/${REPO_OWNER}/${REPO_NAME}/labels\n`));
