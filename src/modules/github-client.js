/** Fetch issue data dari GitHub API */
export async function fetchIssueData(octokit, config) {
  const { data } = await octokit.issues.get({
    owner: config.owner,
    repo: config.repo,
    issue_number: config.issueNumber,
  });
  return data;
}
