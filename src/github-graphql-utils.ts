import { graphql } from '@octokit/graphql';
import { Repository } from './generated/graphql';

export async function simpleQuery(token: string, owner: string, repo: string): Promise<any> {
  const res = await graphql({
    query: `
      query last($owner: String!, $repo: String!) {
        repository(owner:$owner, name:$repo) {
          issues(last: 1, states:OPEN) {
            nodes {
              number
              timelineItems(last: 1, itemTypes: LABELED_EVENT) {
                totalCount
                nodes {
                  ... on LabeledEvent {
                    createdAt
                    label {
                      name
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
  });
  return res;
}

export async function simpleQuery2(token: string, owner: string, repo: string): Promise<any> {
  const xxx = await graphql<Repository>({
    query: `
      query last($owner: String!, $repo: String!) {
        repository(owner:$owner, name:$repo) {
          issues(last: 1, states:OPEN) {
            nodes {
              number
              timelineItems(last: 1, itemTypes: LABELED_EVENT) {
                totalCount
                nodes {
                  ... on LabeledEvent {
                    createdAt
                    label {
                      name
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
  });
  const xxx2 = xxx.issues.nodes?.map(n => n?.timelineItems);
  return xxx2;
}
