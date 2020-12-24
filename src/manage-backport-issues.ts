import * as core from '@actions/core';
import { inspect } from 'util';
import { Jexl } from 'jexl';
import { ExpressionContext } from './interfaces';
import { evaluateAndLog, isResultTruthy, resultAsStringArray } from './jexl-utils';
import { isAction, isEvent } from './context-utils';
import { createIssue, findIssuesWithLabels } from './github-utils';

/**
 * Type of manageBackportIssues logic.
 */
export interface ManageBackportIssues {
  whenLabeled: string;
  whenLabels: string;
  fromLabels: string;
  additionalLabels: string;
  title: string;
  body: string;
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

  // we only do something when issue is labeled, for now
  if (!isEvent(expressionContext.context, 'issues') || !isAction(expressionContext.context, 'labeled')) {
    return;
  }

  const whenLabeled = isResultTruthy(await evaluateAndLog(jexl, recipe.whenLabeled, expressionContext));
  const whenLabels = isResultTruthy(await evaluateAndLog(jexl, recipe.whenLabels, expressionContext));
  const fromLabels = resultAsStringArray(await evaluateAndLog(jexl, recipe.fromLabels, expressionContext));
  const additionalLabels = resultAsStringArray(await evaluateAndLog(jexl, recipe.additionalLabels, expressionContext));
  const title = await evaluateAndLog(jexl, recipe.title, expressionContext);
  const body = await evaluateAndLog(jexl, recipe.body, expressionContext);

  if (whenLabeled && whenLabels) {
    await findThenCreate(token, owner, repo, fromLabels, additionalLabels, title, body, issueNumber);
  }

  // const evalWhenLabeled = await evaluateAndLog(jexl, recipe.whenLabeled, expressionContext);
  // const evalFromLabels = await evaluateAndLog(jexl, recipe.fromLabels, expressionContext);
  // const evalAdditionalLabels = await evaluateAndLog(jexl, recipe.additionalLabels, expressionContext);

  // const usedWhenLabeled = resultAsStringArray(evalWhenLabeled);
  // const usedFromLabels = resultAsStringArray(evalFromLabels);
  // const usedAdditionalLabels = resultAsStringArray(evalAdditionalLabels);
  // const usedTitle = await evaluateAndLog(jexl, recipe.title, expressionContext);
  // const usedBody = await evaluateAndLog(jexl, recipe.body, expressionContext);

  // const xor = (left: boolean, right: boolean ) => ( left || right ) && !( left && right );

  // if (containsLabeled(expressionContext.context, usedWhenLabeled) || containsAnyLabel(expressionContext.context, usedWhenLabeled)) {
  // if (xor(containsLabeled(expressionContext.context, usedWhenLabeled), containsAnyLabel(expressionContext.context, usedWhenLabeled))) {
  //   for (const l of usedFromLabels) {
  //     const issues = await findIssuesWithLabels(token, owner, repo, `Backport#${issueNumber}:${usedTitle}`, [l]);
  //     if (issues.length == 0) {
  //       const usedAdditionalLabelsX = [...usedAdditionalLabels, l];
  //       await createIssue(token, owner, repo, `Backport#${issueNumber}:${usedTitle}`, usedBody, usedAdditionalLabelsX);
  //     }
  //   }
  // }
  // if (containsLabeled(expressionContext.context, usedWhenLabeled) && containsAnyLabel(expressionContext.context, usedWhenLabeled)) {
  //   await findThenCreate(token, owner, repo, usedFromLabels, usedAdditionalLabels, usedTitle, usedBody, issueNumber);
  // } else if (!containsLabeled(expressionContext.context, usedWhenLabeled) && containsAnyLabel(expressionContext.context, usedWhenLabeled)) {
  //   await findThenCreate(token, owner, repo, usedFromLabels, usedAdditionalLabels, usedTitle, usedBody, issueNumber);
  // }
}

async function findThenCreate(
  token: string,
  owner: string,
  repo: string,
  usedFromLabels: string[],
  usedAdditionalLabels: string[],
  usedTitle: string,
  usedBody: string,
  issueNumber: number
): Promise<void> {
  for (const l of usedFromLabels) {
    const issues = await findIssuesWithLabels(token, owner, repo, `Backport#${issueNumber}:${usedTitle}`, [l]);
    if (issues.length == 0) {
      const usedAdditionalLabelsX = [...usedAdditionalLabels, l];
      await createIssue(token, owner, repo, `Backport#${issueNumber}:${usedTitle}`, usedBody, usedAdditionalLabelsX);
    }
  }
}
