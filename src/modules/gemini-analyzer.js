/**
 * Gemini Analyzer
 * Menjalankan analisis cerdas 6-langkah menggunakan Gemini 2.0 Flash.
 * Mengembalikan JSON terstruktur untuk semua keputusan triage.
 */

export async function analyzeWithGemini(ai, { config, availableLabels, recentIssues, relatedFiles }) {
  const issueText = `${config.issueTitle} ${config.issueBody || ""}`;
  const isIndonesian = /\b(dan|atau|yang|tidak|dengan|untuk|dari|adalah|ini|itu|bisa|perlu|ada|saya|kami|tolong|mohon|bagaimana|kenapa|mengapa|apakah)\b/i.test(issueText);

  const recentSummary = recentIssues.slice(0, 20)
    .map(i => `#${i.number} [${i.state}]: ${i.title}`)
    .join("\n");

  const fileContext = relatedFiles
    .map(f => `### ${f.path}\n\`\`\`\n${f.snippet}\n\`\`\``)
    .join("\n\n");

  const prompt = `
Kamu adalah Issue Triage Agent untuk repository GitHub "${config.owner}/${config.repo}".

## ISSUE BARU
- Nomor: #${config.issueNumber}
- Judul: ${config.issueTitle}
- Pembuat: @${config.issueAuthor}
- Label terpasang: ${config.existingLabels.join(", ") || "(tidak ada)"}
- Deskripsi:
\`\`\`
${config.issueBody || "(tidak ada deskripsi)"}
\`\`\`

## ISSUE TERBARU (90 HARI, open+closed)
${recentSummary || "(tidak ada)"}

## FILE TERKAIT DI CODEBASE
${fileContext || "(tidak ada file relevan ditemukan)"}

## LABEL TERSEDIA DI REPO
${availableLabels.join(", ") || "(tidak ada label — gunakan label umum: bug, feature, question, documentation)"}

---
## INSTRUKSI

Lakukan triage sesuai 6 langkah berikut. Balas HANYA JSON valid:

{
  "step1": {
    "jenis": "bug | feature | question | chore | documentation",
    "ringkasan": "ringkasan 1 kalimat",
    "gejala": "gejala yang dilaporkan atau null",
    "langkah_reproduksi": "langkah reproduksi atau null",
    "environment": "OS/versi/browser atau null",
    "perlu_klarifikasi": false,
    "pertanyaan_klarifikasi": []
  },
  "step2": {
    "status": "unique | duplicate | related",
    "nomor_referensi": null,
    "keyakinan": "high | medium | low | null",
    "alasan": "alasan singkat"
  },
  "step3": {
    "file_terkait": [
      { "path": "src/file.js", "alasan": "alasan relevansi" }
    ],
    "tidak_ada_file": false
  },
  "step4": {
    "label": ["bug"],
    "prioritas": "P0 | P1 | P2 | P3",
    "alasan_prioritas": "alasan 1 kalimat",
    "estimasi_ukuran": "XS | S | M | L | XL",
    "alasan_ukuran": "alasan 1 kalimat",
    "langkah_pertama": ["langkah 1", "langkah 2", "langkah 3"]
  },
  "step6": {
    "buat_draft_pr": false,
    "alasan": "alasan",
    "branch_name": null,
    "pr_judul": null,
    "perubahan_diusulkan": null
  }
}

ATURAN PENTING:
- Pilih label HANYA dari daftar label tersedia. Jika kosong, gunakan: bug/feature/question/documentation
- step2.status "duplicate" hanya jika ada issue SANGAT MIRIP (akar masalah sama)
- step6.buat_draft_pr = true HANYA jika estimasi XS/S DAN prioritas P1/P2/P3 DAN ada lokasi kode yang jelas
- branch_name format: fix/issue-${config.issueNumber}-slug-singkat atau feat/issue-${config.issueNumber}-slug-singkat
- Ikuti bahasa issue (${isIndonesian ? "Indonesia" : "English"}) untuk semua teks narasi
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
    config: { temperature: 0.15, responseMimeType: "application/json" },
  });

  const raw = (response.text ?? "").trim();

  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) return JSON.parse(match[1].trim());
    throw new Error(`Gemini returned invalid JSON:\n${raw.slice(0, 300)}`);
  }
}
