/** Terapkan label ke issue via GitHub API */
export async function applyLabels(octokit, config, analysis, availableLabels) {
  const { step1, step2, step4 } = analysis;

  // Jika duplicate → hanya pasang label "duplicate" jika ada
  if (step2.status === "duplicate") {
    const dupLabel = availableLabels.find(l => l === "duplicate" || l === "wontfix");
    if (dupLabel) {
      await octokit.issues.addLabels({
        owner: config.owner, repo: config.repo,
        issue_number: config.issueNumber, labels: [dupLabel],
      });
      return [dupLabel];
    }
    return [];
  }

  // Jika perlu klarifikasi → pasang needs-more-info
  if (step1.perlu_klarifikasi) {
    const label = availableLabels.find(l => l.includes("more-info") || l.includes("triage"));
    if (label) {
      await octokit.issues.addLabels({
        owner: config.owner, repo: config.repo,
        issue_number: config.issueNumber, labels: [label],
      });
    }
    return label ? [label] : [];
  }

  // Normal: filter label yang ada di repo dan belum terpasang
  const toAdd = step4.label.filter(l =>
    availableLabels.includes(l) && !config.existingLabels.includes(l)
  );

  if (toAdd.length === 0) return [];

  await octokit.issues.addLabels({
    owner: config.owner, repo: config.repo,
    issue_number: config.issueNumber, labels: toAdd,
  });

  return toAdd;
}
