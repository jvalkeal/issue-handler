import { graphql } from '@octokit/graphql';
import { Repository } from './generated/graphql';

export interface StaleIssue {
  number: number;
  owner: string;
  title: string;
  createdAt: Date;
  // hasStaleLabel: boolean;
}

/**
 * Query open issues from a repo by adding fields which is needed
 * to eventually come up with an actual stale issues.
 */
export async function queryStaleIssues(token: string, owner: string, repo: string): Promise<StaleIssue[]> {
  const issues = await graphql<{ repository: Repository }>({
    query: `
      query staleIssues($owner: String!, $repo: String!) {
        repository(owner:$owner, name:$repo) {
          issues(last: 100, states:OPEN) {
            nodes {
              number
              title
              createdAt
              updatedAt
              author {
                login
              }
              timelineItems(last: 10, itemTypes: [LABELED_EVENT,ISSUE_COMMENT]) {
                totalCount
                nodes {
                  ... on LabeledEvent {
                    __typename
                    createdAt
                    label {
                      name
                    }
                  }
                  ... on IssueComment {
                    __typename
                    createdAt
                    author {
                      login
                    }
                  }
                }
              }
            }
          }
        }
      }
    `,
    owner,
    repo,
    headers: {
      authorization: `token ${token}`
    }
  }).then(res => res.repository.issues);

  // we now have a query result so go through it and come up with
  // an actual stale issues.

  const staleIssues: StaleIssue[] = [];

  issues.nodes?.forEach(i => {
    // if just to get past beyond ts null checks, we know stuff is there
    // but some reason schema typings i.e. thinks number may be undefined
    if (i?.number && i.title && i.author?.login) {
      const createdAt = new Date(i.createdAt);
      staleIssues.push({
        number: i.number,
        owner: i.author.login,
        title: i.title,
        createdAt
      });
    }
  });

  return staleIssues;
}
