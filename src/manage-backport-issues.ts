import * as core from '@actions/core';
import { inspect } from 'util';
import { Jexl } from 'jexl';
import { ExpressionContext } from './interfaces';
import { evaluateAndLog, isResultTruthy, resultAsStringArray } from './jexl-utils';
import { containsAnyEvent, isAction, isEvent } from './context-utils';
import { closeIssue, createIssue, findIssuesWithLabels } from './github-utils';

/**
 * Type of manageBackportIssues logic.
 */
export interface ManageBackportIssues {
  whenLabeled?: string;
  whenUnlabeled?: string;
  whenLabels: string;
  fromLabels: string;
  additionalLabels?: string;
  body?: string;
}

/**
 * Handling logic of 'manageBackportIssues'.
 */
export async function handleManageBackportIssues(
  recipe: ManageBackportIssues,
  jexl: Jexl,
  expressionContext: ExpressionContext,
  token: string
): Promise<void> {
  core.debug(`manageBackportIssues ${inspect(recipe)}`);
  const owner = expressionContext.context.repo.owner;
  const repo = expressionContext.context.repo.repo;
  const issueNumber = expressionContext.context.issue.number;
  const issueTitle = expressionContext.title;

  // only handle issues and pr's
  if (!containsAnyEvent(expressionContext.context, ['issues', 'pull_request'])) {
    return;
  }

  const title = `backport(${issueNumber}): ${issueTitle}`;
  const whenLabels = isResultTruthy(await evaluateAndLog(jexl, recipe.whenLabels, expressionContext));
  const fromLabels = resultAsStringArray(await evaluateAndLog(jexl, recipe.fromLabels, expressionContext));

  if (isAction(expressionContext.context, 'labeled') && recipe.whenLabeled) {
    const whenLabeled = isResultTruthy(await evaluateAndLog(jexl, recipe.whenLabeled, expressionContext));
    let additionalLabels: string[] = [];
    if (recipe.additionalLabels) {
      additionalLabels = resultAsStringArray(await evaluateAndLog(jexl, recipe.additionalLabels, expressionContext));
    }
    let body = '';
    if (recipe.body) {
      body = await evaluateAndLog(jexl, recipe.body, expressionContext);
    }
    if (whenLabeled && whenLabels) {
      await findThenCreate(token, owner, repo, fromLabels, additionalLabels, title, body);
    }
  }

  if (isAction(expressionContext.context, 'unlabeled') && recipe.whenUnlabeled) {
    const whenUnlabeled = isResultTruthy(await evaluateAndLog(jexl, recipe.whenUnlabeled, expressionContext));
    if (whenUnlabeled && whenLabels) {
      await findThenClose(token, owner, repo, fromLabels, title);
    }
  }
}

async function findThenCreate(
  token: string,
  owner: string,
  repo: string,
  usedFromLabels: string[],
  usedAdditionalLabels: string[],
  usedTitle: string,
  usedBody: string
): Promise<void> {
  for (const l of usedFromLabels) {
    const issues = await findIssuesWithLabels(token, owner, repo, usedTitle, [l]);
    if (issues.length == 0) {
      await createIssue(token, owner, repo, usedTitle, usedBody, [...usedAdditionalLabels, l]);
    }
  }
}

async function findThenClose(
  token: string,
  owner: string,
  repo: string,
  labels: string[],
  title: string
): Promise<void> {
  for (const l of labels) {
    const issues = await findIssuesWithLabels(token, owner, repo, title, [l]);
    if (issues.length > 0) {
      for (const n of issues) {
        await closeIssue(token, owner, repo, n);
      }
    }
  }
}
