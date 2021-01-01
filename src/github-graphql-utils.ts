import { graphql } from '@octokit/graphql';

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
      }
    `,
    owner,
    repo,
    headers: {
      authorization: `token ${token}`
    }
  });
  // const graphqlWithAuth = graphql.defaults({
  //   headers: {
  //     authorization: `token ${token}`
  //   }
  // })
  // ;

  // const res = await graphqlWithAuth(`
  //   query ($owner: String!, $repo: String!) {
  //     repository(owner:$owner, name:$repo) {
  //       issues(last: 1, states:OPEN) {
  //         nodes {
  //           number
  //           timelineItems(last: 1, itemTypes: LABELED_EVENT) {
  //             totalCount
  //             nodes {
  //               ... on LabeledEvent {
  //                 createdAt
  //                 label {
  //                   name
  //                 }
  //               }
  //             }
  //           }
  //         }
  //       }
  //     }
  //   }
  //   `);
  return res;
}
