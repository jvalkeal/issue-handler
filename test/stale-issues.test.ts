import { Jexl } from 'jexl';
import nock from 'nock';
import { handleStaleIssues, StaleIssues } from '../src//stale-issues';
import { ExpressionContext } from '../src/interfaces';
import {
  CONTEXT_LABELED_ISSUE_FAST_1,
  CONTEXT_LABELED_ISSUE_FAST_2,
  CONTEXT_LABELED_ISSUE_FAST_3,
  CONTEXT_LABELED_ISSUE_SLOW_1,
  CONTEXT_LABELED_ISSUE_SLOW_2,
  CONTEXT_UNLABELED_ISSUE
} from './mock-data';

describe('stale-issues tests', () => {

  const EC_FAST_1: ExpressionContext = {
    context: CONTEXT_LABELED_ISSUE_FAST_1,
    body: 'fake body',
    title: 'fake title',
    number: 1,
    actor: 'actor',
    data: {}
  };

  it('finds stale issues', async () => {

    nock('https://api.github.com')
      .post('/graphql')
      .reply(200, {
        data: {
          repository: {
            issues: {
              nodes: [
                {
                  number: 1,
                  title: 'title1',
                  createdAt: '2020-12-23T22:46:52Z',
                  updatedAt: '2020-12-27T10:17:25Z',
                  author: {
                    login: 'user1'
                  },
                  timelineItems: {
                    totalCount: 26,
                    nodes: [
                      {
                        __typename: 'LabeledEvent',
                        createdAt: '2020-12-25T15:11:10Z',
                        label: {
                          name: 'branch/2.2.x'
                        }
                      },
                      {
                        __typename: 'LabeledEvent',
                        createdAt: '2020-12-27T10:16:46Z',
                        label: {
                          name: 'branch/2.2.x'
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        }
      });

    const action: StaleIssues = {
      issueDaysBeforeStale: 8
    };
    const jexl = new Jexl();
    await handleStaleIssues(action, jexl, EC_FAST_1, 'token');
  });

});
