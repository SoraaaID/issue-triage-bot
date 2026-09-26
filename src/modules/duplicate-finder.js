/** Cari issue duplikat/terkait dalam 90 hari terakhir */
export async function findDuplicates(octokit, config) {
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const [open, closed] = await Promise.all([
    octokit.paginate(octokit.issues.listForRepo, {
      owner: config.owner, repo: config.repo,
      state: "open", since, per_page: 50,
    }),
    octokit.paginate(octokit.issues.listForRepo, {
      owner: config.owner, repo: config.repo,
      state: "closed", since, per_page: 50,
    }),
  ]);

  return [...open, ...closed]
    .filter(i => i.number !== config.issueNumber && !i.pull_request)
    .map(i => ({ number: i.number, title: i.title, state: i.state, body: (i.body || "").slice(0, 200) }));
}
