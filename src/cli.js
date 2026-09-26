/**
 * Issue Triage Bot — CLI Entry Point
 *
 * Modes:
 *   --mode=actions   → Baca env vars dari GitHub Actions (otomatis)
 *   --mode=manual    → Triase issue tertentu secara manual
 *
 * Usage manual:
 *   node src/cli.js --mode=manual --owner=SoraDev-ID --repo=my-repo --issue=42
 */
import "dotenv/config";
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { runTriage } from "./triage-engine.js";

const program = new Command();

program
  .name("issue-triage-bot")
  .description("🤖 Automated GitHub Issue Triage Bot (Gemini-powered)")
  .version("1.0.0")
  .option("--mode <mode>", "Mode: actions | manual", "manual")
  .option("--owner <owner>", "GitHub repo owner (manual mode)")
  .option("--repo <repo>", "GitHub repo name (manual mode)")
  .option("--issue <number>", "Issue number to triage (manual mode)")
  .parse();

const opts = program.opts();

console.log(chalk.bold.cyan(`
╔═══════════════════════════════════════════════╗
║      🤖  Issue Triage Bot  v1.0.0             ║
║   Automated GitHub Issue Triage (Gemini AI)   ║
╚═══════════════════════════════════════════════╝
`));

let config;

if (opts.mode === "actions") {
  // Baca dari GitHub Actions environment variables
  const required = ["GITHUB_TOKEN", "GEMINI_API_KEY", "REPO_OWNER", "REPO_NAME", "ISSUE_NUMBER"];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.error(chalk.red(`❌ Missing env vars: ${missing.join(", ")}`));
    process.exit(1);
  }

  config = {
    githubToken: process.env.GITHUB_TOKEN,
    geminiKey: process.env.GEMINI_API_KEY,
    owner: process.env.REPO_OWNER,
    repo: process.env.REPO_NAME,
    issueNumber: parseInt(process.env.ISSUE_NUMBER),
    issueTitle: process.env.ISSUE_TITLE || "",
    issueBody: process.env.ISSUE_BODY || "",
    issueAuthor: process.env.ISSUE_AUTHOR || "",
    existingLabels: JSON.parse(process.env.ISSUE_LABELS || "[]").map(l => l.name),
  };
} else {
  // Manual mode
  if (!opts.owner || !opts.repo || !opts.issue) {
    console.error(chalk.red("❌ Manual mode membutuhkan: --owner, --repo, --issue"));
    console.error(chalk.dim("   Contoh: node src/cli.js --mode=manual --owner=SoraDev-ID --repo=my-repo --issue=42"));
    process.exit(1);
  }
  if (!process.env.GITHUB_TOKEN || !process.env.GEMINI_API_KEY) {
    console.error(chalk.red("❌ Buat file .env dengan GITHUB_TOKEN dan GEMINI_API_KEY"));
    process.exit(1);
  }

  config = {
    githubToken: process.env.GITHUB_TOKEN,
    geminiKey: process.env.GEMINI_API_KEY,
    owner: opts.owner,
    repo: opts.repo,
    issueNumber: parseInt(opts.issue),
    // akan di-fetch dari API
    issueTitle: null,
    issueBody: null,
    issueAuthor: null,
    existingLabels: [],
  };
}

const spinner = ora({ text: "Starting triage...", color: "cyan" }).start();

try {
  const result = await runTriage(config, spinner);
  spinner.succeed(chalk.green("Triage selesai!"));

  console.log(chalk.bold("\n📋 Hasil Triage:"));
  console.log(`  Issue:      #${result.issueNumber} — ${result.issueTitle}`);
  console.log(`  Jenis:      ${result.type}`);
  console.log(`  Duplikat:   ${result.duplicateStatus}`);
  console.log(`  Label:      ${result.labelsApplied.join(", ") || "(tidak ada)"}`);
  console.log(`  Prioritas:  ${result.priority}`);
  console.log(`  Ukuran:     ${result.size}`);
  if (result.prUrl) console.log(`  Draft PR:   ${chalk.cyan(result.prUrl)}`);
  console.log("");
} catch (err) {
  spinner.fail(chalk.red("Triage gagal!"));
  console.error(chalk.red("\n❌ Error:"), err.message);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
}
