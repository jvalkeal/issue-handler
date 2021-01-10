import { graphql } from '@octokit/graphql';
import { Repository, LabeledEvent } from './generated/graphql';

export interface StaleIssue {
  number: number;
  owner: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  hasStaleLabel: boolean;
  staleLabelAt: Date | undefined;
  // lastCommentAt: Data | undefined;
}

export async function queryStaleIssues(
  token: string,
  owner: string,
  repo: string,
  staleLabel: string,
  cursor: string | null = null,
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

      // should we get label from labels or events
      // const hasStaleLabel = i.labels?.nodes?.some(l => l?.name === staleLabel) || false;

      const labeledCreatedAt = i.timelineItems.nodes
        ?.reverse()
        .filter((ti): ti is LabeledEvent => ti?.__typename === 'LabeledEvent')
        .filter(ti => ti.label.name === staleLabel)
        .find(ti => ti)?.createdAt;
      const hasStaleLabel = labeledCreatedAt !== undefined;
      const staleAt = labeledCreatedAt !== undefined ? new Date(labeledCreatedAt) : undefined;

      staleIssues.push({
        number: i.number,
        owner: i.author.login,
        title: i.title,
        createdAt,
        updatedAt,
        hasStaleLabel,
        staleLabelAt: staleAt
      });
    }
  });

  results.push(...staleIssues);

  if (issues.pageInfo?.hasNextPage) {
    await queryStaleIssues(token, owner, repo, staleLabel, issues.pageInfo.endCursor, results);
  }

  return results;
}
