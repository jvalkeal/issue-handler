import { Jexl } from 'jexl';
import nock from 'nock';
import lodash from 'lodash';
import { handleStaleIssues, StaleIssues } from '../src/stale-issues';
import { ExpressionContext } from '../src/interfaces';
import { CONTEXT_WORKFLOW_DISPATCH_1 } from './mock-data';
import {
  GQ_1_STALE_HAVE_STALE_LABEL_OLD_COMMENT,
  GQ_1_STALE_HAVE_STALE_LABEL_NEW_COMMENT,
  GQ_1_STALE_NO_LABELS,
  GQ_1_EMPTY,
  GQ_2_ISSUES
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

  let addLabelsToIssueSpy: jest.SpyInstance<Promise<void>>;
  let closeIssueSpy: jest.SpyInstance<Promise<void>>;
  let removeLabelFromIssueSpy: jest.SpyInstance<Promise<void>>;
  let addCommentToIssueSpy: jest.SpyInstance<Promise<void>>;

  beforeEach(() => {
    addLabelsToIssueSpy = jest.spyOn(githubUtils, 'addLabelsToIssue').mockImplementation(() => {
      return Promise.resolve();
    });
    closeIssueSpy = jest.spyOn(githubUtils, 'closeIssue').mockImplementation(() => {
      return Promise.resolve();
    });
    removeLabelFromIssueSpy = jest.spyOn(githubUtils, 'removeLabelFromIssue').mockImplementation(() => {
      return Promise.resolve();
    });
    addCommentToIssueSpy = jest.spyOn(githubUtils, 'addCommentToIssue').mockImplementation(() => {
      return Promise.resolve();
    });
  });

  it('stale issue with since', async () => {
    nock('https://api.github.com')
      .post('/graphql', body => {
        const ret = lodash.isMatchWith(
          body,
          {
            variables: {
              since: ''
            }
          },
          objValue => {
            return objValue.since ? true : false;
          }
        );
        return ret;
      })
      .reply(200, GQ_1_EMPTY);

    const action: StaleIssues = {
      issueSince: 1,
      issueBeforeStale: 2
    };
    const jexl = new Jexl();
    await handleStaleIssues(action, jexl, EC_WORKFLOW_DISPATCH_1, 'token');

    expect(addLabelsToIssueSpy).not.toHaveBeenCalled();
    expect(closeIssueSpy).not.toHaveBeenCalled();
    expect(removeLabelFromIssueSpy).not.toHaveBeenCalled();
    expect(addCommentToIssueSpy).not.toHaveBeenCalled();
  });

  it('stale issue - default label', async () => {
    nock('https://api.github.com')
      .post('/graphql')
      .reply(200, GQ_1_STALE_NO_LABELS);

    const action: StaleIssues = {
      issueBeforeStale: 2
    };
    const jexl = new Jexl();
    await handleStaleIssues(action, jexl, EC_WORKFLOW_DISPATCH_1, 'token');

    expect(addLabelsToIssueSpy).toHaveBeenCalledWith('token', 'owner', 'repo', 1, ['stale']);
    expect(closeIssueSpy).not.toHaveBeenCalled();
    expect(removeLabelFromIssueSpy).not.toHaveBeenCalled();
    expect(addCommentToIssueSpy).not.toHaveBeenCalled();
  });

  it('stale issue - change default label', async () => {
    nock('https://api.github.com')
      .post('/graphql')
      .reply(200, GQ_1_STALE_NO_LABELS);

    const action: StaleIssues = {
      issueBeforeStale: 2,
      issueStaleLabel: 'status/stale',
      issueStaleMessage: 'marking stale'
    };
    const jexl = new Jexl();
    await handleStaleIssues(action, jexl, EC_WORKFLOW_DISPATCH_1, 'token');

    expect(addLabelsToIssueSpy).toHaveBeenCalledWith('token', 'owner', 'repo', 1, ['status/stale']);
    expect(closeIssueSpy).not.toHaveBeenCalled();
    expect(removeLabelFromIssueSpy).not.toHaveBeenCalled();
    expect(addCommentToIssueSpy).toHaveBeenCalledWith('token', 'owner', 'repo', 1, 'marking stale');
  });

  it('closes stale issue', async () => {
    nock('https://api.github.com')
      .post('/graphql')
      .reply(200, GQ_1_STALE_HAVE_STALE_LABEL_OLD_COMMENT);

    const action: StaleIssues = {
      issueBeforeStale: 2,
      issueBeforeClose: 1,
      issueCloseLabel: 'closed',
      issueCloseMessage: 'marking closed'
    };
    const jexl = new Jexl();
    await handleStaleIssues(action, jexl, EC_WORKFLOW_DISPATCH_1, 'token');

    expect(addLabelsToIssueSpy).toHaveBeenCalledWith('token', 'owner', 'repo', 1, ['closed']);
    expect(closeIssueSpy).toHaveBeenCalledWith('token', 'owner', 'repo', 1);
    expect(removeLabelFromIssueSpy).toHaveBeenCalledWith('token', 'owner', 'repo', 1, ['stale']);
    expect(addCommentToIssueSpy).toHaveBeenCalledWith('token', 'owner', 'repo', 1, 'marking closed');
  });

  it('unstale stale issue when updated', async () => {
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

    expect(addLabelsToIssueSpy).not.toHaveBeenCalled();
    expect(closeIssueSpy).not.toHaveBeenCalled();
    expect(removeLabelFromIssueSpy).toHaveBeenCalledWith('token', 'owner', 'repo', 1, ['stale']);
    expect(addCommentToIssueSpy).not.toHaveBeenCalled();
  });

  it('skip unstale stale issue when updated with config', async () => {
    nock('https://api.github.com')
      .post('/graphql')
      .reply(200, GQ_1_STALE_HAVE_STALE_LABEL_NEW_COMMENT);

    const action: StaleIssues = {
      issueBeforeStale: 2,
      issueBeforeClose: 1,
      issueCloseLabel: 'closed',
      issueUnstaleWhenUpdated: false
    };
    const jexl = new Jexl();
    await handleStaleIssues(action, jexl, EC_WORKFLOW_DISPATCH_1, 'token');

    expect(addLabelsToIssueSpy).not.toHaveBeenCalled();
    expect(closeIssueSpy).not.toHaveBeenCalled();
    expect(removeLabelFromIssueSpy).not.toHaveBeenCalled();
    expect(addCommentToIssueSpy).not.toHaveBeenCalled();
  });

  it('exempt label skips handling', async () => {
    nock('https://api.github.com')
      .post('/graphql')
      .reply(200, GQ_2_ISSUES);

    const action: StaleIssues = {
      issueBeforeStale: 1,
      issueExemptLabels: ['exempt']
    };
    const jexl = new Jexl();
    await handleStaleIssues(action, jexl, EC_WORKFLOW_DISPATCH_1, 'token');

    expect(addLabelsToIssueSpy).toBeCalledTimes(1);
    expect(addLabelsToIssueSpy).toHaveBeenCalledWith('token', 'owner', 'repo', 2, ['stale']);
    expect(closeIssueSpy).not.toHaveBeenCalled();
    expect(removeLabelFromIssueSpy).not.toHaveBeenCalled();
    expect(addCommentToIssueSpy).not.toHaveBeenCalled();
  });
});
