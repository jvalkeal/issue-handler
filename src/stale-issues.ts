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

async function processIssues(
  token: string,
  expressionContext: ExpressionContext,
  staleIssues: StaleIssue[],
  config: StaleIssuesConfig,
  dryRun: boolean
) {
  // when issues become stale
  core.info(`issueDaysBeforeStale ${config.issueDaysBeforeStale}`);
  const staleDate = moment(new Date()).subtract(config.issueDaysBeforeStale, 'days');
  core.info(`staleDate ${staleDate}`);
  const closeDate = moment(new Date())
    .subtract(config.issueDaysBeforeClose, 'days')
    .toDate();
  core.info(`closeDate ${closeDate}`);

  // going through issues
  for (const i of staleIssues) {
    core.info(`#${i.number} updatedAt ${i.updatedAt}`);
    if (i.updatedAt) {
      const diffInDays = moment(staleDate).diff(moment(i.updatedAt), 'days');
      core.info(`#${i.number} stale diff ${diffInDays} days`);
      if (diffInDays > 0) {
        await handleStaleIssue(token, expressionContext, i, config, closeDate, dryRun);
      }
    }
  }
}

async function handleStaleIssue(
  token: string,
  expressionContext: ExpressionContext,
  staleIssue: StaleIssue,
  config: StaleIssuesConfig,
  closeDate: Date,
  dryRun: boolean
) {
  core.info(`Handling stale issue #${staleIssue.number}`);
  const owner = expressionContext.context.repo.owner;
  const repo = expressionContext.context.repo.repo;

  // if no stale label, add it
  if (!staleIssue.hasStaleLabel) {
    core.info(`Found issue #${staleIssue.number} to become stale`);
    if (!dryRun) {
      await addLabelsToIssue(token, owner, repo, staleIssue.number, [config.issueStaleLabel]);
    }
  } else if (staleIssue.staleLabelAt) {
    if (staleIssue.lastCommentAt && staleIssue.lastCommentAt > staleIssue.staleLabelAt) {
      // there's a user comment after stale label, un-stale
      if (!dryRun) {
        await removeLabelFromIssue(token, owner, repo, staleIssue.number, [config.issueStaleLabel]);
      }
    } else {
      // if stale label exists, check timeline when it was marked stale,
      // then close if stale enough time
      if (staleIssue.staleLabelAt && staleIssue.staleLabelAt < closeDate) {
        core.info(`Found issue #${staleIssue.number} to close as stale`);
        if (!dryRun) {
          await closeIssue(token, owner, repo, staleIssue.number);
          if (config.issueCloseLabel) {
            await addLabelsToIssue(token, owner, repo, staleIssue.number, [config.issueCloseLabel]);
          }
        }
      }
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

function numberValue(value: number | undefined, defaultValue: number) {
  if (value === 0) {
    return value;
  }
  return value || defaultValue;
}
