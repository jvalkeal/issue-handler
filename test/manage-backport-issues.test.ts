import { Jexl } from 'jexl';
import nock from 'nock';
import lodash from 'lodash';
import { ExpressionContext } from '../src/interfaces';
import { handleManageBackportIssues, ManageBackportIssues } from '../src/manage-backport-issues';
import { addJexlFunctions } from '../src/jexl-functions';
import {
  CONTEXT_LABELED_ISSUE_FAST_1,
  CONTEXT_LABELED_ISSUE_FAST_2,
  CONTEXT_LABELED_ISSUE_FAST_3,
  CONTEXT_LABELED_ISSUE_SLOW_1,
  CONTEXT_LABELED_ISSUE_SLOW_2
} from './mock-data';

describe('manage-backport-issues tests', () => {
  const EC_FAST_1: ExpressionContext = {
    context: CONTEXT_LABELED_ISSUE_FAST_1,
    body: 'fake body',
    title: 'fake title',
    number: 1
  };
  const EC_FAST_2: ExpressionContext = {
    context: CONTEXT_LABELED_ISSUE_FAST_2,
    body: 'fake body',
    title: 'fake title',
    number: 1
  };
  const EC_FAST_3: ExpressionContext = {
    context: CONTEXT_LABELED_ISSUE_FAST_3,
    body: 'fake body',
    title: 'fake title',
    number: 1
  };
  const EC_SLOW_1: ExpressionContext = {
    context: CONTEXT_LABELED_ISSUE_SLOW_1,
    body: 'fake body',
    title: 'fake title',
    number: 1
  };
  const EC_SLOW_2: ExpressionContext = {
    context: CONTEXT_LABELED_ISSUE_SLOW_2,
    body: 'fake body',
    title: 'fake title',
    number: 1
  };

  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    // make sure we had a call
    if (!nock.isDone()) {
      console.log('pending mocks: %j', nock.pendingMocks());
      throw new Error('Not all nock interceptors were used!');
    }
  });

  it('creates two issues when labeled same time', async () => {
    const action: ManageBackportIssues = {
      whenLabeled: "labeledStartsWith(['branch/'])",
      whenLabels: "labelsContains(['for/backport'])",
      fromLabels: "labeledStartsWith(['branch/'])",
      additionalLabels: "'fakelabel'",
      title: 'title',
      body: "'Backport #' + number"
    };

    const jexl1 = new Jexl();
    const jexl2 = new Jexl();
    const jexl3 = new Jexl();
    addJexlFunctions(jexl1, 'token', CONTEXT_LABELED_ISSUE_FAST_1);
    addJexlFunctions(jexl2, 'token', CONTEXT_LABELED_ISSUE_FAST_2);
    addJexlFunctions(jexl3, 'token', CONTEXT_LABELED_ISSUE_FAST_3);

    nock('https://api.github.com')
      .persist()
      .get('/search/issues')
      .query(obj => {
        return (
          obj.q === 'repo:owner/repo is:open label:branch/1.0.x Backport#1:fake title in:title' ||
          obj.q === 'repo:owner/repo is:open label:branch/2.0.x Backport#1:fake title in:title'
        );
      })
      .reply(200, { items: [] });

    nock('https://api.github.com')
      .post('/repos/owner/repo/issues', body => {
        return (
          lodash.isMatch(body, {
            title: 'Backport#1:fake title',
            body: 'Backport #1'
          }) &&
          (lodash.isMatch(body, {
            labels: ['fakelabel', 'branch/1.0.x']
          }) ||
            lodash.isMatch(body, {
              labels: ['fakelabel', 'branch/2.0.x']
            }))
        );
      })
      .times(2)
      .reply(201);

    await handleManageBackportIssues(action, jexl1, EC_FAST_1, 'fake');
    await handleManageBackportIssues(action, jexl2, EC_FAST_2, 'fake');
    await handleManageBackportIssues(action, jexl3, EC_FAST_3, 'fake');
  });

  it('creates two issues when labeled individually', async () => {
    const action: ManageBackportIssues = {
      whenLabeled: "labeledStartsWith(['branch/'])",
      whenLabels: "labelsContains(['for/backport'])",
      fromLabels: "labeledStartsWith(['branch/'])",
      additionalLabels: "'fakelabel'",
      title: 'title',
      body: "'Backport #' + number"
    };

    const jexl1 = new Jexl();
    const jexl2 = new Jexl();
    addJexlFunctions(jexl1, 'token', CONTEXT_LABELED_ISSUE_SLOW_1);
    addJexlFunctions(jexl2, 'token', CONTEXT_LABELED_ISSUE_SLOW_2);

    nock('https://api.github.com')
      .persist()
      .get('/search/issues')
      .query(obj => {
        return (
          obj.q === 'repo:owner/repo is:open label:branch/1.0.x Backport#1:fake title in:title' ||
          obj.q === 'repo:owner/repo is:open label:branch/2.0.x Backport#1:fake title in:title'
        );
      })
      .reply(200, { items: [] });

    nock('https://api.github.com')
      .post('/repos/owner/repo/issues', body => {
        return (
          lodash.isMatch(body, {
            title: 'Backport#1:fake title',
            body: 'Backport #1'
          }) &&
          (lodash.isMatch(body, {
            labels: ['fakelabel', 'branch/1.0.x']
          }) ||
            lodash.isMatch(body, {
              labels: ['fakelabel', 'branch/2.0.x']
            }))
        );
      })
      .times(1)
      .reply(201);

    await handleManageBackportIssues(action, jexl1, EC_SLOW_1, 'fake');
    await handleManageBackportIssues(action, jexl2, EC_SLOW_2, 'fake');
  });
});
