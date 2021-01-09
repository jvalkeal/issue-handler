import { Context } from '@actions/github/lib/context';

/**
 * Checks if issue contains all given labels.
 *
 * @param labels Labels to check, can be string or string[]
 * @returns boolean indicating if all labels existed
 */
export function containsLabels(githubContext: Context, labels: string | string[]): boolean {
  const payloadLabelObjects = (githubContext.payload.issue || githubContext.payload.pull_request)?.labels as {
    name: string;
  }[];
  if (payloadLabelObjects) {
    const labelsToCheck = typeof labels === 'string' ? [labels] : labels;
    const existingLabels = payloadLabelObjects.map(l => l.name);
    const check = labelsToCheck.every(el => {
      return existingLabels.indexOf(el) !== -1;
    });
    return check;
  }
  return false;
}

export function containsAnyLabel(githubContext: Context, labels: string[]): boolean {
  const payloadLabelObjects = (githubContext.payload.issue || githubContext.payload.pull_request)?.labels as {
    name: string;
  }[];
  if (payloadLabelObjects) {
    const labelsToCheck = typeof labels === 'string' ? [labels] : labels;
    const existingLabels = payloadLabelObjects.map(l => l.name);
    return existingLabels.some(l => labelsToCheck.indexOf(l) !== -1);
  }
  return false;
}

export function isLabeled(githubContext: Context, label: string): boolean {
  return githubContext.payload.label?.name === label;
}

export function containsLabeled(githubContext: Context, labels: string[]): boolean {
  return labels.some(l => l === githubContext.payload.label?.name);
}

export function labeledStartsWith(githubContext: Context, labels: string[]): string[] {
  const labelName = githubContext.payload.label?.name as string;
  if (labelName) {
    if (labels.some(l => labelName.startsWith(l))) {
      return [labelName];
    }
  }
  return [];
}

export function getLabelsStartsWith(githubContext: Context, labels: string[]): string[] {
  const payloadLabelObjects = (githubContext.payload.issue || githubContext.payload.pull_request)?.labels as {
    name: string;
  }[];
  if (payloadLabelObjects) {
    return payloadLabelObjects.filter(rl => labels.some(l => rl.name.startsWith(l))).map(l => l.name);
  }
  return [];
}

/**
 * Checks if given event is same as in a context.
 */
export function isEvent(githubContext: Context, event: string): boolean {
  return githubContext.eventName === event;
}

export function containsAnyEvent(githubContext: Context, events: string | string[]): boolean {
  const eventsToCheck = typeof events === 'string' ? [events] : events;
  return eventsToCheck.some(e => e === githubContext.eventName);
}

export function containsAnyAction(githubContext: Context, actions: string | string[]): boolean {
  const actionsToCheck = typeof actions === 'string' ? [actions] : actions;
  return actionsToCheck.some(e => e === githubContext.payload.action);
}

/**
 * Checks if given action is same as in a context.
 */
export function isAction(githubContext: Context, action: string): boolean {
  return githubContext.payload.action === action;
}
