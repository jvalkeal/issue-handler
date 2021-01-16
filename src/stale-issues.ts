import * as core from '@actions/core';
import { Jexl } from 'jexl';
import { inspect } from 'util';
import moment from 'moment';
import { queryStaleIssues, StaleIssue } from './github-graphql-utils';
import { ExpressionContext } from './interfaces';
import { addLabelsToIssue, closeIssue, removeLabelFromIssue } from './github-utils';

export interface StaleIssues {
  issueHandleSince?: string;
  issueDaysBeforeStale?: number;
  issueDaysBeforeClose?: number;
  issueStaleMessage?: string;
  issueCloseMessage?: string;
  issueStaleLabel?: string;
  issueCloseLabel?: string;
  issueExemptLabels?: string | string[];
  issueRemoveStaleWhenUpdated?: boolean;
}

export interface StaleIssuesConfig {
  issueDaysBeforeStale: number;
  issueDaysBeforeClose: number;
  issueStaleLabel: string;
  issueCloseLabel: string | undefined;
}

enum IssueState {
  // issue is good
  Active = 'Active',
  // issue should become stale
  Stale = 'Stale',
  // issue should get unstaled
  Unstale = 'Unstale',
  // issue should get closed from stale
  Close = 'Close'
}

/**
 * Main hook to handle stale issues recipe.
 */
export async function handleStaleIssues(
  recipe: StaleIssues,
  jexl: Jexl,
  expressionContext: ExpressionContext,
  token: string,
  dryRun: boolean = false
) {
  const owner = expressionContext.context.repo.owner;
  const repo = expressionContext.context.repo.repo;

  core.info(`Incoming config ${inspect(recipe)}`);
  const config = resolveConfig(recipe);
  core.info(`Used config ${inspect(config)}`);

  core.info(`Doing queryStaleIssues`);
  // for now just blindly query all open issues
  const staleIssues = await queryStaleIssues(token, owner, repo, config.issueStaleLabel);
  core.info(`Result queryStaleIssues ${inspect(staleIssues, true, 10)}`);

  await processIssues(token, expressionContext, staleIssues, config, dryRun);
}

function getState(staleIssue: StaleIssue, staleDate: Date, closeDate: Date): IssueState {
  if (staleIssue.hasStaleLabel) {
    if (staleIssue.lastCommentAt && staleIssue.staleLabelAt && staleIssue.lastCommentAt > staleIssue.staleLabelAt) {
      return IssueState.Unstale;
    }
    return IssueState.Close;
  } else {
    const diffInDays = moment(staleDate).diff(moment(staleIssue.updatedAt), 'days');
    if (diffInDays > 0) {
      return IssueState.Stale;
    }
  }
  return IssueState.Active;
}

async function processIssues(
  token: string,
  expressionContext: ExpressionContext,
  staleIssues: StaleIssue[],
  config: StaleIssuesConfig,
  dryRun: boolean
) {
  // when issues become stale
  core.info(`issueDaysBeforeStale ${config.issueDaysBeforeStale}`);
  const staleDate = moment(new Date())
    .subtract(config.issueDaysBeforeStale, 'days')
    .toDate();
  core.info(`staleDate ${staleDate}`);
  const closeDate = moment(new Date())
    .subtract(config.issueDaysBeforeClose, 'days')
    .toDate();
  core.info(`closeDate ${closeDate}`);

  // going through issues
  for (const i of staleIssues) {
    const state = getState(i, staleDate, closeDate);
    core.info(`#${i.number} state ${state}`);
    switch (state) {
      case IssueState.Stale:
        await handleStaleIssue(token, expressionContext, i, config, dryRun);
        break;
      case IssueState.Unstale:
        await handleUnstaleIssue(token, expressionContext, i, config, dryRun);
        break;
      case IssueState.Close:
        await handleCloseIssue(token, expressionContext, i, config, dryRun);
        break;
      default:
        break;
    }
  }
}

async function handleStaleIssue(
  token: string,
  expressionContext: ExpressionContext,
  staleIssue: StaleIssue,
  config: StaleIssuesConfig,
  dryRun: boolean
) {
  const owner = expressionContext.context.repo.owner;
  const repo = expressionContext.context.repo.repo;
  core.info(`Issue #${staleIssue.number} to become stale`);
  if (!dryRun) {
    await addLabelsToIssue(token, owner, repo, staleIssue.number, [config.issueStaleLabel]);
  }
}

async function handleUnstaleIssue(
  token: string,
  expressionContext: ExpressionContext,
  staleIssue: StaleIssue,
  config: StaleIssuesConfig,
  dryRun: boolean
) {
  const owner = expressionContext.context.repo.owner;
  const repo = expressionContext.context.repo.repo;
  core.info(`Issue #${staleIssue.number} to become un-stale`);
  if (!dryRun) {
    await removeLabelFromIssue(token, owner, repo, staleIssue.number, [config.issueStaleLabel]);
  }
}

async function handleCloseIssue(
  token: string,
  expressionContext: ExpressionContext,
  staleIssue: StaleIssue,
  config: StaleIssuesConfig,
  dryRun: boolean
) {
  const owner = expressionContext.context.repo.owner;
  const repo = expressionContext.context.repo.repo;
  core.info(`Issue #${staleIssue.number} to close as stale`);
  if (!dryRun) {
    await closeIssue(token, owner, repo, staleIssue.number);
    await removeLabelFromIssue(token, owner, repo, staleIssue.number, [config.issueStaleLabel]);
  }
  if (config.issueCloseLabel) {
    core.info(`Issue #${staleIssue.number} add close label ${config.issueCloseLabel}`);
    if (!dryRun) {
      await addLabelsToIssue(token, owner, repo, staleIssue.number, [config.issueCloseLabel]);
    }
  }
}

/**
 * Resolves an actual config with defaults, etc.
 */
function resolveConfig(recipe: StaleIssues): StaleIssuesConfig {
  return {
    issueDaysBeforeStale: numberValue(recipe.issueDaysBeforeStale, 60),
    issueDaysBeforeClose: numberValue(recipe.issueDaysBeforeClose, 7),
    issueStaleLabel: recipe.issueStaleLabel || 'stale',
    issueCloseLabel: recipe.issueCloseLabel
  };
}

/**
 * Returns value or default and handles if value is "falsy".
 */
function numberValue(value: number | undefined, defaultValue: number): number {
  if (value === 0) {
    return value;
  }
  return value || defaultValue;
}
