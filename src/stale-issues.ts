import * as core from '@actions/core';
import { Jexl } from 'jexl';
import { inspect } from 'util';
import { simpleQuery } from './github-graphql-utils';
import { ExpressionContext } from './interfaces';

export interface StaleIssues {
  issueHandleDayAfter?: string;
  issueHandleDayBefore?: string;
  issueDaysBeforeStale?: number;
  issueDaysBeforeClose?: number;
  issueStaleMessage?: string;
  issueCloseMessage?: string;
  issueStaleLabel?: string | string[];
  issueCloseLabel?: string | string[];
  issueExemptLabel?: string | string[];
  issueRemoveStaleWhenUpdated?: boolean;
}

export async function handleStaleIssues(
  recipe: StaleIssues,
  jexl: Jexl,
  expressionContext: ExpressionContext,
  token: string
) {
  core.info(`Incoming config ${inspect(recipe)}`);
  const config = resolveConfig(recipe);
  core.info(`Used config ${inspect(config)}`);
  core.info(`Doing simpleQuery`);
  const data = await simpleQuery(token);
  core.info(`Result simpleQuery ${inspect(data, true, 10)}`);
}

/**
 * Resolves an actual config with defaults, etc.
 */
function resolveConfig(recipe: StaleIssues): StaleIssues {
  return {
    issueHandleDayAfter: recipe.issueHandleDayAfter,
    issueHandleDayBefore: recipe.issueHandleDayBefore,
    issueDaysBeforeStale: recipe.issueDaysBeforeStale || 60,
    issueDaysBeforeClose: recipe.issueDaysBeforeClose || 7
  };
}
