/**
 * Triage Engine — Orkestrasi 6 langkah triage
 */
import { Octokit } from "@octokit/rest";
import { GoogleGenAI } from "@google/genai";
import { fetchIssueData } from "./modules/github-client.js";
import { findDuplicates } from "./modules/duplicate-finder.js";
import { findRelatedFiles } from "./modules/code-searcher.js";
import { analyzeWithGemini } from "./modules/gemini-analyzer.js";
import { postTriageComment } from "./modules/commenter.js";
import { applyLabels } from "./modules/labeler.js";
import { createDraftPR } from "./modules/pr-creator.js";

export async function runTriage(config, spinner) {
  const octokit = new Octokit({ auth: config.githubToken });
  const ai = new GoogleGenAI({ apiKey: config.geminiKey });

  // ── Langkah 0: Fetch issue jika manual mode ─────────────────────────────────
  if (!config.issueTitle) {
    spinner.text = "Mengambil data issue dari GitHub...";
    const issueData = await fetchIssueData(octokit, config);
    config.issueTitle = issueData.title;
    config.issueBody = issueData.body;
    config.issueAuthor = issueData.user.login;
    config.existingLabels = issueData.labels.map(l => l.name);
  }

  spinner.text = `Memproses issue #${config.issueNumber}: "${config.issueTitle}"`;

  // ── Langkah 1: Ambil label tersedia di repo ──────────────────────────────────
  spinner.text = "Mengambil daftar label repo...";
  const { data: repoLabelsRaw } = await octokit.issues.listLabelsForRepo({
    owner: config.owner, repo: config.repo, per_page: 100,
  });
  const availableLabels = repoLabelsRaw.map(l => l.name);

  // ── Langkah 2: Cari duplikat (90 hari terakhir) ──────────────────────────────
  spinner.text = "Mencari issue duplikat/terkait (90 hari)...";
  const recentIssues = await findDuplicates(octokit, config);

  // ── Langkah 3: Cari file terkait di codebase ─────────────────────────────────
  spinner.text = "Mencari file relevan di codebase...";
  const relatedFiles = await findRelatedFiles(config);

  // ── Langkah 4+1: Analisis Gemini (step 1-4+6 sekaligus) ─────────────────────
  spinner.text = "Menganalisis dengan Gemini AI...";
  const analysis = await analyzeWithGemini(ai, {
    config,
    availableLabels,
    recentIssues,
    relatedFiles,
  });

  // ── Langkah 5a: Tulis komentar triage ───────────────────────────────────────
  spinner.text = "Menulis komentar triage...";
  await postTriageComment(octokit, config, analysis);

  // ── Langkah 5b: Terapkan label ───────────────────────────────────────────────
  spinner.text = "Menerapkan label...";
  const labelsApplied = await applyLabels(octokit, config, analysis, availableLabels);

  // ── Langkah 6: Buat draft PR (jika XS/S dan bukan P0) ────────────────────────
  let prUrl = null;
  if (analysis.step6?.buat_draft_pr) {
    spinner.text = "Membuat draft PR...";
    const pr = await createDraftPR(octokit, config, analysis);
    prUrl = pr?.html_url || null;
  }

  return {
    issueNumber: config.issueNumber,
    issueTitle: config.issueTitle,
    type: analysis.step1.jenis,
    duplicateStatus: analysis.step2.status,
    labelsApplied,
    priority: analysis.step4.prioritas,
    size: analysis.step4.estimasi_ukuran,
    prUrl,
  };
}
