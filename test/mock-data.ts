import { Context } from '@actions/github/lib/context';
import { WebhookPayload } from '@actions/github/lib/interfaces';
import { ISSUE_UNLABELED_JSON } from './data/issue-unlabeled.mock';
import {
  ISSUE_LABELED_JSON_FAST_1,
  ISSUE_LABELED_JSON_FAST_2,
  ISSUE_LABELED_JSON_FAST_3,
  ISSUE_LABELED_JSON_SLOW_1,
  ISSUE_LABELED_JSON_SLOW_2
} from './data/issue-labeled.mock';

export const CONTEXT_UNLABELED_ISSUE = mockContext(ISSUE_UNLABELED_JSON, 'issues');
export const CONTEXT_LABELED_ISSUE_FAST_1 = mockContext(ISSUE_LABELED_JSON_FAST_1, 'issues');
export const CONTEXT_LABELED_ISSUE_FAST_2 = mockContext(ISSUE_LABELED_JSON_FAST_2, 'issues');
export const CONTEXT_LABELED_ISSUE_FAST_3 = mockContext(ISSUE_LABELED_JSON_FAST_3, 'issues');
export const CONTEXT_LABELED_ISSUE_SLOW_1 = mockContext(ISSUE_LABELED_JSON_SLOW_1, 'issues');
export const CONTEXT_LABELED_ISSUE_SLOW_2 = mockContext(ISSUE_LABELED_JSON_SLOW_2, 'issues');

function mockContext(data: string, eventName: string): Context {
  const c: Context = {
    payload: mockPayload(data),
    eventName,
    sha: 'sha',
    ref: 'refs/heads/master',
    workflow: 'workflow',
    action: 'run',
    actor: 'actor',
    job: 'job',
    runNumber: 1,
    runId: 1,
    issue: {
      owner: 'owner',
      repo: 'repo',
      number: 1
    },
    repo: {
      owner: 'owner',
      repo: 'repo'
    }
  };
  return c;
}

function mockPayload(data: string): WebhookPayload {
  return JSON.parse(data) as WebhookPayload;
}
