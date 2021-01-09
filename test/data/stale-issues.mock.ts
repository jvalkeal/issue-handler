import moment from 'moment';

const NOWMINUS1D = moment().subtract(1, 'days').toISOString();
const NOWMINUS2D = moment().subtract(2, 'days').toISOString();
const NOWMINUS3D = moment().subtract(3, 'days').toISOString();
const NOWMINUS4D = moment().subtract(4, 'days').toISOString();
const NOWMINUS5D = moment().subtract(5, 'days').toISOString();
const NOWMINUS6D = moment().subtract(6, 'days').toISOString();

export const GQ_1_STALE_NO_LABELS = {
  data: {
    repository: {
      issues: {
        nodes: [
          {
            number: 1,
            title: 'title1',
            createdAt: NOWMINUS6D,
            updatedAt: NOWMINUS3D,
            author: {
              login: 'user1'
            },
            timelineItems: {
            }
          }
        ]
      }
    }
  }
};

export const GQ_1_STALE_HAVE_STALE_LABEL = {
  data: {
    repository: {
      issues: {
        nodes: [
          {
            number: 1,
            title: 'title1',
            createdAt: NOWMINUS6D,
            updatedAt: NOWMINUS3D,
            author: {
              login: 'user1'
            },
            labels: {
              nodes: [
                {
                  name: 'stale'
                }
              ]
            },
            timelineItems: {
              totalCount: 26,
              nodes: [
                {
                  __typename: 'LabeledEvent',
                  createdAt: NOWMINUS3D,
                  label: {
                    name: 'stale'
                  }
                }
              ]
            }
          }
        ]
      }
    }
  }
};

export const GQ_1_ISSUE = {
  data: {
    repository: {
      issues: {
        nodes: [
          {
            number: 1,
            title: 'title1',
            createdAt: NOWMINUS6D,
            updatedAt: NOWMINUS3D,
            author: {
              login: 'user1'
            },
            timelineItems: {
              totalCount: 26,
              nodes: [
                {
                  __typename: 'LabeledEvent',
                  createdAt: NOWMINUS2D,
                  label: {
                    name: 'branch/2.2.x'
                  }
                },
                {
                  __typename: 'LabeledEvent',
                  createdAt: NOWMINUS2D,
                  label: {
                    name: 'branch/2.2.x'
                  }
                }
              ]
            }
          }
        ]
      }
    }
  }
};

export const GQ_2_ISSUES = {
  data: {
    repository: {
      issues: {
        nodes: [
          {
            number: 1,
            title: 'title1',
            createdAt: NOWMINUS6D,
            updatedAt: NOWMINUS2D,
            author: {
              login: 'user1'
            },
            timelineItems: {
            }
          },
          {
            number: 2,
            title: 'title2',
            createdAt: NOWMINUS6D,
            updatedAt: NOWMINUS5D,
            author: {
              login: 'user2'
            },
            timelineItems: {
            }
          }
        ]
      }
    }
  }
};

export const GQ_PAGE1 = {
  data: {
    repository: {
      issues: {
        pageInfo: {
          endCursor: 'cursor1',
          hasNextPage: true
        },
        nodes: [
          {
            number: 1,
            title: 'title1',
            createdAt: NOWMINUS6D,
            updatedAt: NOWMINUS3D,
            author: {
              login: 'user1'
            },
            timelineItems: {
            }
          }
        ]
      }
    }
  }
};

export const GQ_PAGE2 = {
  data: {
    repository: {
      issues: {
        pageInfo: {
          endCursor: 'cursor2',
          hasNextPage: false
        },
        nodes: [
          {
            number: 2,
            title: 'title2',
            createdAt: NOWMINUS6D,
            updatedAt: NOWMINUS3D,
            author: {
              login: 'user2'
            },
            timelineItems: {
            }
          }
        ]
      }
    }
  }
};
