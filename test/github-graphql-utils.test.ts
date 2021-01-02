import nock from 'nock';
import { queryStaleIssues } from '../src/github-graphql-utils';

describe('github-graphql-utils tests', () => {
  it('queryStaleIssues returns correct data', async () => {
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

    const res = await queryStaleIssues('token', 'owner', 'repo');
    expect(res).toBeTruthy();
    expect(res).toHaveLength(1);
    expect(res[0].number).toBe(1);
    expect(res[0].title).toBe('title1');
    expect(res[0].owner).toBe('user1');
  });
});
