import { graphql } from '@octokit/graphql';
import { Repository } from './generated/graphql';

interface StaleIssue {
  number: number;
  owner: string;
  title: string;
  // hasStaleLabel: boolean;
}

export async function queryStaleIssues(token: string, owner: string, repo: string): Promise<StaleIssue[]> {
  const issues = await graphql<{ repository: Repository }>({
    query: `
      query last($owner: String!, $repo: String!) {
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

  const staleIssues: StaleIssue[] = [];

  issues.nodes?.forEach(i => {
    if (i?.number && i.title && i.author?.login) {
      staleIssues.push({
        number: i.number,
        owner: i.author.login,
        title: i.title
      });
    }
  });

  return staleIssues;
}
