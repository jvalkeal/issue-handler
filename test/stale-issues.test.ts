import { Jexl } from 'jexl';
import nock from 'nock';
import { handleStaleIssues, StaleIssues } from '../src/stale-issues';
import { ExpressionContext } from '../src/interfaces';
import { CONTEXT_WORKFLOW_DISPATCH_1 } from './mock-data';
import {
  GQ_1_STALE_HAVE_STALE_LABEL_OLD_COMMENT,
  GQ_1_STALE_HAVE_STALE_LABEL_NEW_COMMENT,
  GQ_1_STALE_NO_LABELS
} from './data/stale-issues.mock';
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

  it('stale issue - default label', async () => {
    const spy = jest.spyOn(githubUtils, 'addLabelsToIssue').mockImplementation(() => {
      return Promise.resolve();
    });

    nock('https://api.github.com')
      .post('/graphql')
      .reply(200, GQ_1_STALE_NO_LABELS);

    const action: StaleIssues = {
      issueBeforeStale: 2
    };
    const jexl = new Jexl();
    await handleStaleIssues(action, jexl, EC_WORKFLOW_DISPATCH_1, 'token');
    expect(spy).toHaveBeenCalledWith('token', 'owner', 'repo', 1, ['stale']);
  });

  it('stale issue - change default label', async () => {
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
      issueBeforeStale: 2,
      issueStaleLabel: 'status/stale'
    };
    const jexl = new Jexl();
    await handleStaleIssues(action, jexl, EC_WORKFLOW_DISPATCH_1, 'token');
    expect(spy1).toHaveBeenCalledWith('token', 'owner', 'repo', 1, ['status/stale']);
    expect(spy2).not.toHaveBeenCalled();
  });

  it('closes stale issue', async () => {
    const spy1 = jest.spyOn(githubUtils, 'addLabelsToIssue').mockImplementation(() => {
      return Promise.resolve();
    });
    const spy2 = jest.spyOn(githubUtils, 'closeIssue').mockImplementation(() => {
      return Promise.resolve();
    });
    const spy3 = jest.spyOn(githubUtils, 'removeLabelFromIssue').mockImplementation(() => {
      return Promise.resolve();
    });

    nock('https://api.github.com')
      .post('/graphql')
      .reply(200, GQ_1_STALE_HAVE_STALE_LABEL_OLD_COMMENT);

    const action: StaleIssues = {
      issueBeforeStale: 2,
      issueBeforeClose: 1,
      issueCloseLabel: 'closed'
    };
    const jexl = new Jexl();
    await handleStaleIssues(action, jexl, EC_WORKFLOW_DISPATCH_1, 'token');
    expect(spy2).toHaveBeenCalledWith('token', 'owner', 'repo', 1);
    expect(spy3).toHaveBeenCalledWith('token', 'owner', 'repo', 1, ['stale']);
    expect(spy1).toHaveBeenCalledWith('token', 'owner', 'repo', 1, ['closed']);
  });

  it('unstale stale issue when updated', async () => {
    const spy1 = jest.spyOn(githubUtils, 'addLabelsToIssue').mockImplementation(() => {
      return Promise.resolve();
    });
    const spy2 = jest.spyOn(githubUtils, 'closeIssue').mockImplementation(() => {
      return Promise.resolve();
    });
    const spy3 = jest.spyOn(githubUtils, 'removeLabelFromIssue').mockImplementation(() => {
      return Promise.resolve();
    });

    nock('https://api.github.com')
      .post('/graphql')
      .reply(200, GQ_1_STALE_HAVE_STALE_LABEL_NEW_COMMENT);

    const action: StaleIssues = {
      issueBeforeStale: 2,
      issueBeforeClose: 1,
      issueCloseLabel: 'closed'
    };
    const jexl = new Jexl();
    await handleStaleIssues(action, jexl, EC_WORKFLOW_DISPATCH_1, 'token');
    expect(spy3).toHaveBeenCalledWith('token', 'owner', 'repo', 1, ['stale']);
    expect(spy1).not.toHaveBeenCalled();
    expect(spy2).not.toHaveBeenCalled();
  });
});
