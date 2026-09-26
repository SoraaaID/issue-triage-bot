/** Tulis komentar triage ke issue */

const PRIORITY_EMOJI = { P0: "🔴", P1: "🟠", P2: "🟡", P3: "🔵" };
const SIZE_EMOJI     = { XS: "🟢", S: "🟢", M: "🟡", L: "🟠", XL: "🔴" };

export async function postTriageComment(octokit, config, analysis) {
  const body = buildComment(config, analysis);

  await octokit.issues.createComment({
    owner: config.owner,
    repo: config.repo,
    issue_number: config.issueNumber,
    body,
  });
}

function buildComment(config, analysis) {
  const { step1, step2, step3, step4, step6 } = analysis;

  // Jika perlu klarifikasi → hanya tampilkan pertanyaan
  if (step1.perlu_klarifikasi) {
    const qs = step1.pertanyaan_klarifikasi.map((q, i) => `${i + 1}. ${q}`).join("\n");
    return `## 🔍 Triage Otomatis\n\n` +
      `**Status:** \`needs-more-info\` — Deskripsi tidak cukup untuk ditriase.\n\n` +
      `**Pertanyaan untuk @${config.issueAuthor}:**\n${qs}\n\n` +
      `---\n*🤖 [Issue Triage Bot](https://github.com/${config.owner}/${config.repo}) — Gemini AI*`;
  }

  // Status duplikat
  const dupLine = step2.status === "duplicate"
    ? `duplicate of #${step2.nomor_referensi} *(keyakinan: ${step2.keyakinan})* — ${step2.alasan}`
    : step2.status === "related"
    ? `unique — terkait dengan #${step2.nomor_referensi} (${step2.alasan})`
    : `unique — ${step2.alasan}`;

  // File terkait
  const fileLines = (!step3.tidak_ada_file && step3.file_terkait?.length > 0)
    ? step3.file_terkait.map(f => `- \`${f.path}\` — ${f.alasan}`).join("\n")
    : "- *(Tidak ada file relevan ditemukan di codebase)*";

  // Langkah pertama
  const stepLines = step4.langkah_pertama.map((s, i) => `${i + 1}. ${s}`).join("\n");

  // Draft PR note
  const prNote = step6?.buat_draft_pr
    ? `\n\n**🔀 Draft PR:** Sedang disiapkan di branch \`${step6.branch_name}\``
    : "";

  return `## 🔍 Triage Otomatis

**Status duplikat:** ${dupLine}
**Jenis:** \`${step1.jenis}\` — ${step1.ringkasan}
**Label diusulkan:** ${step4.label.map(l => `\`${l}\``).join(", ")}
**Prioritas:** ${PRIORITY_EMOJI[step4.prioritas]} ${step4.prioritas} — ${step4.alasan_prioritas}
**Estimasi ukuran:** ${SIZE_EMOJI[step4.estimasi_ukuran]} ${step4.estimasi_ukuran} — ${step4.alasan_ukuran}

**File terkait:**
${fileLines}

**Langkah pertama:**
${stepLines}${prNote}

---
*🤖 Diproses otomatis oleh [Issue Triage Bot](https://github.com/${config.owner}/${config.repo}/blob/main/.github/workflows/triage.yml) · Gemini AI · [Perbaiki triage ini](https://github.com/${config.owner}/${config.repo}/issues/new)*`;
}
