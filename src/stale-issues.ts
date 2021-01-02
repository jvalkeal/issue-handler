import * as core from '@actions/core';
import { Jexl } from 'jexl';
import { inspect } from 'util';
import moment from 'moment';
import { queryStaleIssues, StaleIssue } from './github-graphql-utils';
import { ExpressionContext } from './interfaces';

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
  const staleIssues = await queryStaleIssues(token, owner, repo);
  core.info(`Result queryStaleIssues ${inspect(staleIssues, true, 10)}`);

  processIssues(staleIssues, config);
}

function processIssues(staleIssues: StaleIssue[], config: StaleIssuesConfig) {
  core.info(`issueDaysBeforeStale ${config.issueDaysBeforeStale}`);
  const staleDate = moment(new Date()).subtract(config.issueDaysBeforeStale, 'days');
  core.info(`staleDate ${staleDate}`);
  for (const i of staleIssues) {
    core.info(`updatedAt ${i.updatedAt}`);
    if (i.updatedAt) {
      const diffInDays = moment(staleDate).diff(moment(i.updatedAt), 'days');
      core.info(`diff ${diffInDays}`);
      if (diffInDays < 0) {
        core.info(`Found stale issue #${i.number} '${i.title}'`);
      }
    }
  }
}

/**
 * Resolves an actual config with defaults, etc.
 */
function resolveConfig(recipe: StaleIssues): StaleIssuesConfig {
  return {
    issueDaysBeforeStale: recipe.issueDaysBeforeStale || 60,
    issueDaysBeforeClose: recipe.issueDaysBeforeClose || 7
  };
}
