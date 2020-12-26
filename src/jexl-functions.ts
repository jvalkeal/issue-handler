import * as core from '@actions/core';
import { Context } from '@actions/github/lib/context';
import { inspect } from 'util';
import { Jexl } from 'jexl';
import { FunctionFunction } from 'jexl';
import { createIssue, closeIssue, findIssues, addLabelsToIssue } from './github-utils';
import {
  containsLabels,
  isEvent,
  isAction,
  getLabelsStartsWith,
  containsAnyLabel,
  labeledStartsWith
} from './context-utils';

/**
 * Add all supported jexl functions.
 */
export function addJexlFunctions(jexl: Jexl, token: string, githubContext: Context): void {
  // labels
  jexl.addFunction('labelsContainsAll', labelsContainsAllFunction(githubContext));
  jexl.addFunction('labelsContainsAny', labelsContainsAnyFunction(githubContext));
  jexl.addFunction('labelsStartsWith', labelsStartsWithFunction(githubContext));
  jexl.addFunction('hasLabels', hasLabelsFunction(githubContext));

  // labeled
  jexl.addFunction('labeledStartsWith', labeledStartsWithFunction(githubContext));

  // issue
  jexl.addFunction('labelIssue', labelIssueFunction(token, githubContext));

  // generic
  jexl.addFunction('isEvent', isEventFunction(githubContext));
  jexl.addFunction('isAction', isActionFunction(githubContext));
  jexl.addFunction('isMilestone', isMilestoneFunction(githubContext));

  jexl.addFunction('createIssue', createIssueFunction(token, githubContext));
  jexl.addFunction('labelRemoved', labelRemovedFunction(githubContext));
  jexl.addFunction('closeIssues', closeIssuesFunction(token, githubContext));
  jexl.addFunction('findIssuesByTitle', findIssuesByTitleFunction(token, githubContext));
}

/**
 * Function which checks if given labels are present in a payload's issue.
 */
function labelsContainsAllFunction(githubContext: Context): FunctionFunction {
  return (labels: string | string[]) => {
    return containsLabels(githubContext, labels);
  };
}

function labelsContainsAnyFunction(githubContext: Context): FunctionFunction {
  return (labels: string[]) => {
    return containsAnyLabel(githubContext, labels);
  };
}

function labelsStartsWithFunction(githubContext: Context): FunctionFunction {
  return (labels: string[]) => {
    return getLabelsStartsWith(githubContext, labels);
  };
}

/**
 * Creates a function which creates an issue with given title and body.
 */
function createIssueFunction(token: string, githubContext: Context): FunctionFunction {
  return async (title: string, body: string) => {
    await createIssue(token, githubContext.repo.owner, githubContext.repo.repo, title, body);
  };
}

function labeledStartsWithFunction(githubContext: Context): FunctionFunction {
  return (labels: string[]) => {
    return labeledStartsWith(githubContext, labels);
  };
}

/**
 * Creates a function checking if label has been removed.
 */
function labelRemovedFunction(githubContext: Context): FunctionFunction {
  return (label: string) => {
    if (githubContext.payload.action !== 'unlabeled') {
      return false;
    }
    const payloadLabelObject = githubContext.payload.label as { name: string };
    if (payloadLabelObject && payloadLabelObject.name === label) {
      return true;
    }
    return false;
  };
}

/**
 * Creates a function closing issues.
 */
function closeIssuesFunction(token: string, githubContext: Context): FunctionFunction {
  return async (issue_numbers: number[]) => {
    core.debug(`Closing issues ${inspect(issue_numbers)}`);
    for (const issue_number of issue_numbers) {
      await closeIssue(token, githubContext.repo.owner, githubContext.repo.repo, issue_number);
    }
  };
}

/**
 * Creates a function finding issues by title.
 */
function findIssuesByTitleFunction(token: string, githubContext: Context): FunctionFunction {
  return async (title: string) => {
    return await findIssues(token, githubContext.repo.owner, githubContext.repo.repo, title);
  };
}

/**
 * Creates a function checking if given event type equals.
 */
function isEventFunction(githubContext: Context): FunctionFunction {
  return (event: string): boolean => {
    return isEvent(githubContext, event);
  };
}

/**
 * Creates a function checking if action type equals.
 */
function isActionFunction(githubContext: Context): FunctionFunction {
  return (action: string): boolean => {
    return isAction(githubContext, action);
  };
}

/**
 * Creates a function checking if there is a milestone.
 */
function isMilestoneFunction(githubContext: Context): FunctionFunction {
  return (): boolean => {
    return githubContext.payload.issue?.milestone !== null && githubContext.payload.issue?.milestone !== undefined;
  };
}

/**
 * Creates a function checking there's any labels.
 */
function hasLabelsFunction(githubContext: Context): FunctionFunction {
  return (): boolean => {
    const payloadLabelObjects = githubContext.payload.issue?.labels as { name: string }[];
    if (payloadLabelObjects && payloadLabelObjects.length > 0) {
      return true;
    }
    return false;
  };
}

/**
 * Creates a function adding label to an issue.
 */
function labelIssueFunction(token: string, githubContext: Context): FunctionFunction {
  return async (labels: string | string[]) => {
    const labelsToUse = typeof labels === 'string' ? [labels] : labels;
    await addLabelsToIssue(
      token,
      githubContext.repo.owner,
      githubContext.repo.repo,
      githubContext.issue.number,
      labelsToUse
    );
  };
}
