import { Jexl } from 'jexl';
import nock from 'nock';
import { handleStaleIssues, StaleIssues } from '../src/stale-issues';
import * as staleIssues from '../src/stale-issues';
import { ExpressionContext } from '../src/interfaces';
import { CONTEXT_LABELED_ISSUE_FAST_1 } from './mock-data';
import { GQ_1_ISSUE, GQ_2_ISSUES, GQ_1_STALE_NO_LABELS } from './data/stale-issues.mock';
import { StaleIssue } from '../src/github-graphql-utils';
import * as githubUtils from '../src/github-utils';

describe('stale-issues tests', () => {
  const EC_FAST_1: ExpressionContext = {
    context: CONTEXT_LABELED_ISSUE_FAST_1,
    body: 'fake body',
    title: 'fake title',
    number: 1,
    actor: 'actor',
    data: {}
  };

  it('labels 1 issue stale from 1', async () => {
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
    await handleStaleIssues(action, jexl, EC_FAST_1, 'token');
    expect(spy).toHaveBeenCalledWith('token', 'owner', 'repo', 1, ['stale']);
  });

  it('labels 1 issue stale from 1 - change label', async () => {
    const spy = jest.spyOn(githubUtils, 'addLabelsToIssue').mockImplementation(() => {
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
    await handleStaleIssues(action, jexl, EC_FAST_1, 'token');
    expect(spy).toHaveBeenCalledWith('token', 'owner', 'repo', 1, ['status/stale']);
  });

  // it('closes 1 stale issue from 1', async () => {
  //   const spy = jest.spyOn(githubUtils, 'closeIssue').mockImplementation(() => {
  //     return Promise.resolve();
  //   });

  //   nock('https://api.github.com')
  //     .post('/graphql')
  //     .reply(200, GQ_1_ISSUE);

  //   const action: StaleIssues = {
  //     issueDaysBeforeStale: 2
  //   };
  //   const jexl = new Jexl();
  //   await handleStaleIssues(action, jexl, EC_FAST_1, 'token');
  //   expect(spy).toHaveBeenCalledWith('token', 'owner', 'repo', 1);
  // });

  // it('closes 1 stale issue from 2', async () => {
  //   const spy = jest.spyOn(githubUtils, 'closeIssue').mockImplementation(() => {
  //     return Promise.resolve();
  //   });

  //   nock('https://api.github.com')
  //     .post('/graphql')
  //     .reply(200, GQ_2_ISSUES);

  //   const action: StaleIssues = {
  //     issueDaysBeforeStale: 3
  //   };
  //   const jexl = new Jexl();
  //   await handleStaleIssues(action, jexl, EC_FAST_1, 'token');
  //   expect(spy).toHaveBeenCalledWith('token', 'owner', 'repo', 2);
  // });
});
