import { graphql } from '@octokit/graphql';

export async function simpleQuery(token: string): Promise<any> {
  const graphqlWithAuth = graphql.defaults({
    headers: {
      authorization: `token ${token}`
    },
  });

  const { data } = await graphqlWithAuth(`
    query {
      repository(owner: "jvalkeal", name: "atest5") {
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
    `);
  return data;
}