import { graphql } from '@octokit/graphql';
import { RequestParameters } from '@octokit/graphql/dist-types/types';
import { print } from 'graphql';
import {
  LabeledEvent,
  StaleIssues,
  StaleIssuesQueryVariables,
  StaleIssuesQuery,
  IssueComment
} from './generated/graphql';

export interface StaleIssue {
  number: number;
  owner: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  labels: string[];
  hasStaleLabel: boolean;
  staleLabelAt: Date | undefined;
  lastCommentAt: Date | undefined;
}

export async function queryStaleIssues(
  token: string,
  owner: string,
  repo: string,
  staleLabel: string,
  cursor: string | null = null,
  results: StaleIssue[] = []
): Promise<StaleIssue[]> {
  const staleIssues: StaleIssue[] = [];
  const variables: StaleIssuesQueryVariables = {
    owner,
    repo,
    cursor
  };
  const options: RequestParameters = {
    headers: {
      authorization: `token ${token}`
    },
    ...variables
  };

  const issues = await graphql<StaleIssuesQuery>(print(StaleIssues), options);
  issues.repository?.issues.nodes?.forEach(i => {
    // if just to get past beyond ts null checks, we know stuff is there
    // but some reason schema typings i.e. thinks number may be undefined
    if (i?.number && i.title && i.author?.login) {
      const createdAt = new Date(i.createdAt);
      const updatedAt = new Date(i.updatedAt);

      // should we get label from labels or events
      const labels = i.labels?.nodes?.filter(notEmpty).map(l => l?.name) || [];

      const labeledCreatedAt = i.labeledEventsTimeline?.nodes
        ?.reverse()
        .filter((ti): ti is LabeledEvent => ti?.__typename === 'LabeledEvent')
        .filter(ti => ti.label.name === staleLabel)
        .find(ti => ti)?.createdAt;
      const hasStaleLabel = labeledCreatedAt !== undefined;
      const staleAt = labeledCreatedAt !== undefined ? new Date(labeledCreatedAt) : undefined;

      const lastComment = i.issueCommentsTimeline?.nodes
        ?.reverse()
        .filter((ic): ic is IssueComment => ic?.__typename === 'IssueComment')
        .filter(ic => ic.author?.login === i.author?.login)
        .find(ic => ic)?.createdAt;
      const lastCommentAt = lastComment !== undefined ? new Date(lastComment) : undefined;

      staleIssues.push({
        number: i.number,
        owner: i.author.login,
        title: i.title,
        createdAt,
        updatedAt,
        labels,
        hasStaleLabel,
        staleLabelAt: staleAt,
        lastCommentAt
      });
    }
  });

  results.push(...staleIssues);

  if (issues.repository?.issues.pageInfo?.hasNextPage) {
    await queryStaleIssues(token, owner, repo, staleLabel, issues.repository.issues.pageInfo.endCursor, results);
  }

  return results;
}

function notEmpty<V>(value: V | null | undefined): value is V {
  return value !== null && value !== undefined;
}
