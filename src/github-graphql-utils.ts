import { graphql } from '@octokit/graphql';
import { Repository, LabeledEvent } from './generated/graphql';

export interface StaleIssue {
  number: number;
  owner: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  hasStaleLabel: boolean;
  staleAt: Date;
}

// async function fetchStarGazers(octokit, { results, cursor } = { results: [] }) {
//   const { repository: { stargazers } } = await octokit.graphql(QUERY, { cursor });
//   results.push(...stargazers.nodes);
//   if (stargazers.pageInfo.hasNextPage) {
//     await fetchStarGazers(octokit, { results, cursor: stargazers.pageInfo.endCursor });
//   }
//   return results;
// }

export async function queryStaleIssues2(
  token: string,
  owner: string,
  repo: string,
  cursor: string|null = null,
  results: StaleIssue[] = []
): Promise<StaleIssue[]> {
  const issues = await graphql<{ repository: Repository }>({
    query: `
    query staleIssues($owner: String!, $repo: String!, $cursor: String) {
      repository(owner:$owner, name:$repo) {
        issues(last: 100, states:OPEN, after:$cursor) {
          pageInfo {
            endCursor
            hasNextPage
          }
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
    cursor,
    owner,
    repo,
    headers: {
      authorization: `token ${token}`
    }
  }).then(res => res.repository.issues);

  const staleIssues: StaleIssue[] = [];
  issues.nodes?.forEach(i => {
    // if just to get past beyond ts null checks, we know stuff is there
    // but some reason schema typings i.e. thinks number may be undefined
    if (i?.number && i.title && i.author?.login) {
      const createdAt = new Date(i.createdAt);
      const updatedAt = new Date(i.updatedAt);

      const hasStaleLabel = i.labels?.nodes?.some(l => l?.name === 'stale') || false;

      const labeledCreatedAt = i.timelineItems.nodes?.filter((ti): ti is LabeledEvent => ti?.__typename === 'LabeledEvent')
        .find(ti => ti)?.createdAt;
      const staleAt = new Date(labeledCreatedAt);

      staleIssues.push({
        number: i.number,
        owner: i.author.login,
        title: i.title,
        createdAt,
        updatedAt,
        hasStaleLabel,
        staleAt
      });
    }
  });

  results.push(...staleIssues);

  if (issues.pageInfo?.hasNextPage) {
    await queryStaleIssues2(token, owner, repo, issues.pageInfo.endCursor, results);
  }

  return results;
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
      const updatedAt = new Date(i.updatedAt);

      const hasStaleLabel = i.labels?.nodes?.some(l => l?.name === 'stale') || false;

      const labeledCreatedAt = i.timelineItems.nodes?.filter((ti): ti is LabeledEvent => ti?.__typename === 'LabeledEvent')
        .find(ti => ti)?.createdAt;
      const staleAt = new Date(labeledCreatedAt);

      staleIssues.push({
        number: i.number,
        owner: i.author.login,
        title: i.title,
        createdAt,
        updatedAt,
        hasStaleLabel,
        staleAt
      });
    }
  });

  return staleIssues;
}
