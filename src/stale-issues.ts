import * as core from '@actions/core';
import { Jexl } from 'jexl';
import { inspect } from 'util';
import moment from 'moment';
import { queryStaleIssues, StaleIssue } from './github-graphql-utils';
import { ExpressionContext } from './interfaces';
import { addLabelsToIssue, closeIssue, removeLabelFromIssue, addCommentToIssue } from './github-utils';
import { numberValue } from './utils';

export interface StaleIssues {
  issueSince?: number | string;
  issueBeforeStale?: number | string;
  issueBeforeClose?: number | string;
  issueStaleMessage?: string;
  issueCloseMessage?: string;
  issueStaleLabel?: string;
  issueCloseLabel?: string;
  issueExemptLabels?: string | string[];
  issueUnstaleWhenUpdated?: boolean;
}

export interface StaleIssuesConfig {
  issueSince: Date | undefined;
  issueBeforeStale: Date;
  issueBeforeClose: Date;
  issueStaleLabel: string;
  issueCloseLabel: string | undefined;
  issueStaleMessage: string | undefined;
  issueCloseMessage: string | undefined;
  issueExemptLabels: string[];
  issueUnstaleWhenUpdated: boolean;
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
  const issueSince = config.issueSince ? moment(config.issueSince).toISOString() : undefined;
  const staleIssues = await queryStaleIssues(token, owner, repo, config.issueStaleLabel, issueSince);
  core.info(`Result queryStaleIssues ${inspect(staleIssues, true, 10)}`);

  await processIssues(token, expressionContext, staleIssues, config, dryRun);
}

function getState(staleIssue: StaleIssue, staleDate: Date, closeDate: Date): IssueState {
  if (staleIssue.hasStaleLabel) {
    if (staleIssue.lastCommentAt && staleIssue.lastCommentAt > closeDate) {
      return IssueState.Unstale;
    }
    return IssueState.Close;
  } else {
    if (staleIssue.updatedAt < staleDate) {
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
  core.info(`issueBeforeStale ${config.issueBeforeStale}`);
  const staleDate = config.issueBeforeStale;
  core.info(`staleDate ${staleDate}`);
  core.info(`issueBeforeClose ${config.issueBeforeClose}`);
  const closeDate = config.issueBeforeClose;
  core.info(`closeDate ${closeDate}`);

  // going through issues
  for (const i of staleIssues) {
    const exempt = config.issueExemptLabels.some(l => i.labels.indexOf(l) !== -1);
    if (exempt) {
      core.info(`#${i.number} exempt due to issueExemptLabels`);
      continue;
    }

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
  if (config.issueStaleMessage) {
    core.info(`Issue #${staleIssue.number} add comment`);
    if (!dryRun) {
      await addCommentToIssue(token, owner, repo, staleIssue.number, config.issueStaleMessage);
    }
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
  if (!config.issueUnstaleWhenUpdated) {
    core.info(`Issue #${staleIssue.number} skip un-stale due to issueRemoveStaleWhenUpdated`);
    return;
  }
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
  if (config.issueCloseMessage) {
    core.info(`Issue #${staleIssue.number} add comment`);
    if (!dryRun) {
      await addCommentToIssue(token, owner, repo, staleIssue.number, config.issueCloseMessage);
    }
  }
}

/**
 * Resolves an actual config with defaults, etc.
 */
function resolveConfig(recipe: StaleIssues): StaleIssuesConfig {
  let issueSince: Date | undefined = undefined;
  if (typeof recipe.issueSince === 'string' && recipe.issueSince.length > 0) {
    if (recipe.issueSince.charAt(0) === 'P') {
      issueSince = moment()
        .subtract(recipe.issueSince)
        .toDate();
    } else {
      issueSince = moment(recipe.issueSince).toDate();
    }
  } else if (typeof recipe.issueSince === 'number') {
    if (recipe.issueSince > 0) {
      issueSince = moment()
        .subtract(recipe.issueSince, 'days')
        .toDate();
    }
  }

  let issueBeforeStale: Date;
  if (typeof recipe.issueBeforeStale === 'string') {
    issueBeforeStale = moment()
      .subtract(recipe.issueBeforeStale)
      .toDate();
  } else if (typeof recipe.issueBeforeStale === 'number') {
    issueBeforeStale = moment()
      .subtract(numberValue(recipe.issueBeforeStale, 60), 'days')
      .toDate();
  } else {
    issueBeforeStale = moment()
      .subtract(60, 'days')
      .toDate();
  }

  let issueBeforeClose: Date;
  if (typeof recipe.issueBeforeClose === 'string') {
    issueBeforeClose = moment()
      .subtract(recipe.issueBeforeClose)
      .toDate();
  } else if (typeof recipe.issueBeforeClose === 'number') {
    issueBeforeClose = moment()
      .subtract(numberValue(recipe.issueBeforeClose, 7), 'days')
      .toDate();
  } else {
    issueBeforeClose = moment()
      .subtract(7, 'days')
      .toDate();
  }

  let issueExemptLabels: string[] = [];
  if (typeof recipe.issueExemptLabels === 'string') {
    issueExemptLabels = [recipe.issueExemptLabels];
  } else if (Array.isArray(recipe.issueExemptLabels)) {
    issueExemptLabels = [...recipe.issueExemptLabels];
  }

  return {
    issueSince,
    issueBeforeStale,
    issueBeforeClose,
    issueStaleLabel: recipe.issueStaleLabel || 'stale',
    issueCloseLabel: recipe.issueCloseLabel,
    issueStaleMessage: recipe.issueStaleMessage,
    issueCloseMessage: recipe.issueCloseMessage,
    issueExemptLabels,
    issueUnstaleWhenUpdated: recipe.issueUnstaleWhenUpdated === false ? false : true
  };
}
