import * as core from '@actions/core';
import { Jexl } from 'jexl';
import { inspect } from 'util';
import { queryStaleIssues } from './github-graphql-utils';
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
  const stateIssues = await queryStaleIssues(token, owner, repo);
  core.info(`Result queryStaleIssues ${inspect(stateIssues, true, 10)}`);

  for (const i of stateIssues) {
    core.info(`Found stale issue #${i.number} '${i.title}'`);
  }

}

/**
 * Resolves an actual config with defaults, etc.
 */
function resolveConfig(recipe: StaleIssues): StaleIssues {
  return {
    issueDaysBeforeStale: recipe.issueDaysBeforeStale || 60,
    issueDaysBeforeClose: recipe.issueDaysBeforeClose || 7
  };
}
