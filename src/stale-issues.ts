import * as core from '@actions/core';
import { Jexl } from 'jexl';
import { inspect } from 'util';
import moment from 'moment';
import { queryStaleIssues, StaleIssue } from './github-graphql-utils';
import { ExpressionContext } from './interfaces';
import { addLabelsToIssue, closeIssue } from './github-utils';

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
}

/**
 * Main hook to handle stale issues recipe.
 */
export async function handleStaleIssues(
  recipe: StaleIssues,
  jexl: Jexl,
  expressionContext: ExpressionContext,
  token: string
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

  await processIssues(token, expressionContext, staleIssues, config);
}

async function processIssues(
  token: string,
  expressionContext: ExpressionContext,
  staleIssues: StaleIssue[],
  config: StaleIssuesConfig
) {
  // when issues become stale
  core.info(`issueDaysBeforeStale ${config.issueDaysBeforeStale}`);
  const staleDate = moment(new Date()).subtract(config.issueDaysBeforeStale, 'days');
  core.info(`staleDate ${staleDate}`);

  // going through issues
  for (const i of staleIssues) {
    // const hasStaleLabel = i.hasStaleLabel;

    core.info(`#${i.number} updatedAt ${i.updatedAt}`);
    if (i.updatedAt) {
      const diffInDays = moment(staleDate).diff(moment(i.updatedAt), 'days');
      core.debug(`#${i.number} stale diff ${diffInDays} days`);
      if (diffInDays > 0) {
        await handleStaleIssue(token, expressionContext, i, config);
      }
    }
  }
}

async function handleStaleIssue(
  token: string,
  expressionContext: ExpressionContext,
  staleIssue: StaleIssue,
  config: StaleIssuesConfig
) {
  const closeDate = moment(new Date()).subtract(config.issueDaysBeforeClose, 'days');
  const diffInDays = moment(closeDate).diff(moment(new Date()), 'days');
  core.info(`Handling stale issue #${staleIssue.number} '${staleIssue.title}'`);
  const owner = expressionContext.context.repo.owner;
  const repo = expressionContext.context.repo.repo;

  // if no stale label, add it
  if (!staleIssue.hasStaleLabel) {
    await addLabelsToIssue(token, owner, repo, staleIssue.number, [config.issueStaleLabel]);
  } else {
    if (moment(staleIssue.staleAt) < closeDate) {
      await closeIssue(token, owner, repo, staleIssue.number);
    }
  }

  // if stale label exists, check timeline when it was marked stale,
  // then close if stale enough time

  // await closeIssue(token, owner, repo, staleIssue.number);
}

/**
 * Resolves an actual config with defaults, etc.
 */
function resolveConfig(recipe: StaleIssues): StaleIssuesConfig {
  return {
    issueDaysBeforeStale: recipe.issueDaysBeforeStale || 60,
    issueDaysBeforeClose: recipe.issueDaysBeforeClose || 7,
    issueStaleLabel: recipe.issueStaleLabel || 'stale'
  };
}
