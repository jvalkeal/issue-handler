import * as core from '@actions/core';
import * as github from '@actions/github';
import { inspect } from 'util';

/**
 * Create a new GitHub issue.
 */
export async function createIssue(
  token: string,
  owner: string,
  repo: string,
  title: string,
  body: string,
  labels?: string[]
) {
  core.info(`Creating issue with labels '${labels}' with title '${title}'`);
  const octokit = github.getOctokit(token);
  await octokit.issues.create({
    owner,
    repo,
    title,
    body,
    labels: labels || []
  });
}

/**
 * Close an GitHub issue.
 */
export async function closeIssue(token: string, owner: string, repo: string, issue_number: number) {
  core.info(`Closing issue ${owner} ${repo} ${issue_number}`);
  const octokit = github.getOctokit(token);
  await octokit.issues.update({
    owner,
    repo,
    issue_number,
    state: 'closed'
  });
}

/**
 * Find issues by title.
 */
export async function findIssues(token: string, owner: string, repo: string, title: string): Promise<number[]> {
  core.debug(`Finding issues ${owner} ${repo} ${title}`);
  const octokit = github.getOctokit(token);
  const q = encodeURIComponent(`repo:${owner}/${repo} is:open ${title}`);
  const res = await octokit.request(`GET /search/issues?q=${q}`, {
    owner: owner,
    repo: repo,
    title: title
  });
  core.debug(`Finding issues - response ${inspect(res)}`);
  const issueNumbers = res.data as IssueNumbers;
  return issueNumbers.items.map(i => i.number);
}

export async function findIssuesWithLabels(
  token: string,
  owner: string,
  repo: string,
  title: string,
  labels: string[]
): Promise<number[]> {
  const octokit = github.getOctokit(token);
  const labelq = labels.map(l => `label:${l}`).join(' ');
  const q = `repo:${owner}/${repo} is:open ${labelq} ${title} in:title`;
  return octokit.search
    .issuesAndPullRequests({
      q
    })
    .then(res => {
      return res.data.items.map(i => i.number);
    });
}

interface IssueNumbers {
  items: { number: number }[];
}

export async function addLabelsToIssue(
  token: string,
  owner: string,
  repo: string,
  issue_number: number,
  labels: string[]
): Promise<void> {
  core.info(`Adding labels '${labels}' to issue ${issue_number}`);
  const octokit = github.getOctokit(token);
  await octokit.issues.addLabels({
    owner,
    repo,
    issue_number,
    labels
  });
}

export async function removeLabelFromIssue(
  token: string,
  owner: string,
  repo: string,
  issue_number: number,
  labels: string[]
): Promise<void> {
  core.info(`Removing labels '${labels}' from issue ${issue_number}`);
  const octokit = github.getOctokit(token);

  const all = labels.map(label => {
    return octokit.issues.removeLabel({
      owner,
      repo,
      issue_number,
      name: label
    });
  });

  return Promise.all(all).then();
}

export async function getRepoLabels(token: string, owner: string, repo: string): Promise<string[]> {
  const octokit = github.getOctokit(token);
  return octokit.issues
    .listLabelsForRepo({
      owner,
      repo
    })
    .then(res => {
      return res.data.map(d => d.name);
    });
}

export async function getIssueLabels(
  token: string,
  owner: string,
  repo: string,
  issue_number: number
): Promise<string[]> {
  const octokit = github.getOctokit(token);
  return octokit.issues
    .listLabelsOnIssue({
      owner,
      repo,
      issue_number
    })
    .then(res => {
      return res.data.map(d => d.name);
    });
}
