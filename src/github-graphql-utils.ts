import { graphql } from '@octokit/graphql';
import { RequestParameters } from '@octokit/graphql/dist-types/types';
import { Repository, LabeledEvent, StaleIssues, StaleIssuesQueryVariables, StaleIssuesQuery } from './generated/graphql';

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

  const variables: StaleIssuesQueryVariables = {
    owner,
    repo,
    cursor
  };

  const options: RequestParameters = {
    query: StaleIssues,
    headers: {
      authorization: `token ${token}`
    },
    ... variables
  };

  const issues = await graphql<StaleIssuesQuery>(options);

  const staleIssues: StaleIssue[] = [];

  issues.repository?.issues.nodes?.forEach(i => {
    // if just to get past beyond ts null checks, we know stuff is there
    // but some reason schema typings i.e. thinks number may be undefined
    if (i?.number && i.title && i.author?.login) {
      const createdAt = new Date(i.createdAt);
      const updatedAt = new Date(i.updatedAt);

      // should we get label from labels or events

      const labeledCreatedAt = i.labeledEventsTimeline.nodes
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

  if (issues.repository?.issues.pageInfo?.hasNextPage) {
    await queryStaleIssues(token, owner, repo, staleLabel, issues.repository.issues.pageInfo.endCursor, results);
  }

  return results;
}


export async function queryStaleIssues2(
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
    await queryStaleIssues2(token, owner, repo, staleLabel, issues.pageInfo.endCursor, results);
  }

  return results;
}
