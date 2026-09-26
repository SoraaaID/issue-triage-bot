/** Cari file relevan di codebase dengan grep */
import { execSync } from "child_process";
import fs from "fs";

export async function findRelatedFiles(config) {
  // Ekstrak keyword dari judul issue
  const text = `${config.issueTitle} ${config.issueBody || ""}`;
  const keywords = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOP_WORDS.has(w))
    .slice(0, 6);

  const found = new Set();

  for (const kw of keywords) {
    try {
      const result = execSync(
        `grep -rl "${kw}" src/ --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" --include="*.py" 2>/dev/null || true`,
        { encoding: "utf-8", timeout: 5000 }
      ).trim();
      if (result) result.split("\n").filter(Boolean).forEach(f => found.add(f));
    } catch (_) {}
  }

  // Baca 30 baris pertama setiap file
  return [...found].slice(0, 5).map(f => {
    try {
      const snippet = fs.readFileSync(f, "utf-8").split("\n").slice(0, 30).join("\n");
      return { path: f, snippet };
    } catch {
      return { path: f, snippet: "" };
    }
  });
}

const STOP_WORDS = new Set([
  "that","with","this","from","when","after","yang","dengan",
  "tidak","untuk","dari","adalah","have","been","will","would",
  "could","should","their","there","then","than"
]);
