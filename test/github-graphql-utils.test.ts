import nock from 'nock';
import lodash from 'lodash';
import { queryStaleIssues } from '../src/github-graphql-utils';
import { GQ_PAGE1, GQ_PAGE2 } from './data/stale-issues.mock';

describe('github-graphql-utils tests', () => {
  it('queryStaleIssues paging from page1 to page2', async () => {
    nock('https://api.github.com')
      .post('/graphql', body => {
        return lodash.isMatch(body, {
          variables: {
            cursor: null
          }
        });
      })
      .reply(200, GQ_PAGE1);
    nock('https://api.github.com')
      .post('/graphql', body => {
        return lodash.isMatch(body, {
          variables: {
            cursor: 'cursor1'
          }
        });
      })
      .reply(200, GQ_PAGE2);

    const res = await queryStaleIssues('token', 'owner', 'repo', 'status/stale');
    expect(res).toBeTruthy();
    expect(res).toHaveLength(2);
    expect(res[0].number).toBe(1);
    expect(res[0].title).toBe('title1');
    expect(res[0].owner).toBe('user1');
    expect(res[0].hasStaleLabel).toBeFalsy();
    expect(res[0].staleLabelAt).toBeUndefined();
    expect(res[1].number).toBe(2);
    expect(res[1].title).toBe('title2');
    expect(res[1].owner).toBe('user2');
    expect(res[1].hasStaleLabel).toBeTruthy();
    expect(res[1].staleLabelAt).not.toBeUndefined();
  });

  it('queryStaleIssues paging from page2', async () => {
    nock('https://api.github.com')
      .post('/graphql', body => {
        return lodash.isMatch(body, {
          variables: {
            cursor: null
          }
        });
      })
      .reply(200, GQ_PAGE2);

    const res = await queryStaleIssues('token', 'owner', 'repo', 'status/stale');
    expect(res).toBeTruthy();
    expect(res).toHaveLength(1);
    expect(res[0].number).toBe(2);
    expect(res[0].title).toBe('title2');
    expect(res[0].owner).toBe('user2');
    expect(res[0].hasStaleLabel).toBeTruthy();
    expect(res[0].staleLabelAt).not.toBeUndefined();
    expect(res[0].lastCommentAt).not.toBeUndefined();
  });
});
