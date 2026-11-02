/** Buat draft PR otomatis untuk issue kecil (XS/S) */
export async function createDraftPR(octokit, config, analysis) {
  const { step6, step1, step3, step4 } = analysis;
  if (!step6?.buat_draft_pr || !step6.branch_name) return null;

  try {
    // Dapatkan SHA branch utama (main, fallback master) — branch yang berhasil
    // dipakai juga sebagai base PR, bukan di-hardcode ke "main"
    let baseBranch = "main";
    let mainRef;
    try {
      const res = await octokit.git.getRef({
        owner: config.owner, repo: config.repo, ref: "heads/main",
      });
      mainRef = res.data;
    } catch {
      baseBranch = "master";
      const res = await octokit.git.getRef({
        owner: config.owner, repo: config.repo, ref: "heads/master",
      });
      mainRef = res.data;
    }

    // Buat branch baru
    await octokit.git.createRef({
      owner: config.owner, repo: config.repo,
      ref: `refs/heads/${step6.branch_name}`,
      sha: mainRef.object.sha,
    });

    // Buat file catatan triage sebagai commit awal
    const notes = [
      `# Triage Notes — Issue #${config.issueNumber}`,
      "",
      `## Ringkasan`,
      step1.ringkasan,
      "",
      `## Perubahan yang Diusulkan`,
      step6.perubahan_diusulkan || "TBD",
      "",
      `## File Terdampak`,
      ...(step3.file_terkait?.map(f => `- \`${f.path}\`: ${f.alasan}`) || ["TBD"]),
      "",
      `## Prioritas & Ukuran`,
      `- Prioritas: ${step4.prioritas}`,
      `- Ukuran: ${step4.estimasi_ukuran}`,
      "",
      "---",
      "*Dibuat otomatis oleh Issue Triage Bot. Hapus file ini sebelum merge.*",
    ].join("\n");

    await octokit.repos.createOrUpdateFileContents({
      owner: config.owner, repo: config.repo,
      path: `.triage/issue-${config.issueNumber}-notes.md`,
      message: `chore: triage notes for issue #${config.issueNumber}`,
      content: Buffer.from(notes).toString("base64"),
      branch: step6.branch_name,
    });

    // Buat draft PR
    const { data: pr } = await octokit.pulls.create({
      owner: config.owner, repo: config.repo,
      title: step6.pr_judul || `Fix #${config.issueNumber}: ${config.issueTitle.slice(0, 60)}`,
      head: step6.branch_name,
      base: baseBranch,
      draft: true,
      body: [
        `## Deskripsi`,
        `Draft PR otomatis untuk issue #${config.issueNumber}.`,
        "",
        `**Apa yang diubah:**`,
        step6.perubahan_diusulkan || "TBD — perlu investigasi lebih lanjut",
        "",
        `**File terdampak:**`,
        ...(step3.file_terkait?.map(f => `- \`${f.path}\``) || []),
        "",
        `**Cara test manual:**`,
        `1. \`git checkout ${step6.branch_name}\``,
        `2. Implementasikan perubahan yang diusulkan`,
        `3. Verifikasi issue #${config.issueNumber} terselesaikan`,
        "",
        `> ⚠️ **Draft otomatis oleh Issue Triage Bot — mohon review & implementasi sebelum merge.**`,
        "",
        `Closes #${config.issueNumber}`,
      ].join("\n"),
    });

    console.log(`  ✅ Draft PR #${pr.number}: ${pr.html_url}`);
    return pr;
  } catch (err) {
    console.error(`  ⚠️ Gagal buat draft PR: ${err.message}`);
    return null;
  }
}
