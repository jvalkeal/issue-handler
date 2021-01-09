import { Jexl } from 'jexl';
import nock from 'nock';
import { handleStaleIssues, StaleIssues } from '../src/stale-issues';
import * as staleIssues from '../src/stale-issues';
import { ExpressionContext } from '../src/interfaces';
import { CONTEXT_LABELED_ISSUE_FAST_1, CONTEXT_WORKFLOW_DISPATCH_1 } from './mock-data';
import { GQ_1_STALE_HAVE_STALE_LABEL, GQ_1_ISSUE, GQ_2_ISSUES, GQ_1_STALE_NO_LABELS } from './data/stale-issues.mock';
import { StaleIssue } from '../src/github-graphql-utils';
import * as githubUtils from '../src/github-utils';

describe('stale-issues tests', () => {
  const EC_WORKFLOW_DISPATCH_1: ExpressionContext = {
    context: CONTEXT_WORKFLOW_DISPATCH_1,
    body: 'fake body',
    title: 'fake title',
    number: 1,
    actor: 'actor',
    data: {}
  };

  xit('labels 1 issue stale from 1 - default label', async () => {
    const spy = jest.spyOn(githubUtils, 'addLabelsToIssue').mockImplementation(() => {
      return Promise.resolve();
    });

    nock('https://api.github.com')
      .post('/graphql')
      .reply(200, GQ_1_STALE_NO_LABELS);

    const action: StaleIssues = {
      issueDaysBeforeStale: 2
    };
    const jexl = new Jexl();
    await handleStaleIssues(action, jexl, EC_WORKFLOW_DISPATCH_1, 'token');
    expect(spy).toHaveBeenCalledWith('token', 'owner', 'repo', 1, ['stale']);
  });

  xit('labels 1 issue stale from 1 - change label', async () => {
    const spy1 = jest.spyOn(githubUtils, 'addLabelsToIssue').mockImplementation(() => {
      return Promise.resolve();
    });
    const spy2 = jest.spyOn(githubUtils, 'closeIssue').mockImplementation(() => {
      return Promise.resolve();
    });

    nock('https://api.github.com')
      .post('/graphql')
      .reply(200, GQ_1_STALE_NO_LABELS);

    const action: StaleIssues = {
      issueDaysBeforeStale: 2,
      issueStaleLabel: 'status/stale'
    };
    const jexl = new Jexl();
    await handleStaleIssues(action, jexl, EC_WORKFLOW_DISPATCH_1, 'token');
    expect(spy1).toHaveBeenCalledWith('token', 'owner', 'repo', 1, ['status/stale']);
    expect(spy2).not.toHaveBeenCalled();
  });

  it('closes 1 stale issue from 1', async () => {
    const spy1 = jest.spyOn(githubUtils, 'addLabelsToIssue').mockImplementation(() => {
      return Promise.resolve();
    });
    const spy2 = jest.spyOn(githubUtils, 'closeIssue').mockImplementation(() => {
      return Promise.resolve();
    });

    nock('https://api.github.com')
      .post('/graphql')
      .reply(200, GQ_1_STALE_HAVE_STALE_LABEL);

    const action: StaleIssues = {
      issueDaysBeforeStale: 2,
      issueDaysBeforeClose: 1
    };
    const jexl = new Jexl();
    await handleStaleIssues(action, jexl, EC_WORKFLOW_DISPATCH_1, 'token');
    expect(spy1).not.toHaveBeenCalled();
    expect(spy2).toHaveBeenCalledWith('token', 'owner', 'repo', 1);
  });
});
