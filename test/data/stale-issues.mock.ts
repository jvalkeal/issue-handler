import moment from 'moment';

const NOWMINUS1H = moment().subtract(1, 'hours').toISOString();
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
            }
          }
        ]
      }
    }
  }
};

export const GQ_1_STALE_HAVE_STALE_LABEL_OLD_COMMENT = {
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
            labeledEventsTimeline: {
              nodes: [
                {
                  __typename: 'LabeledEvent',
                  createdAt: NOWMINUS3D,
                  label: {
                    name: 'stale'
                  }
                }
              ]
            },
            issueCommentsTimeline: {
              nodes: [
                {
                  __typename: 'IssueComment',
                  createdAt: NOWMINUS4D,
                  author: {
                    login: 'user1'
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

export const GQ_1_STALE_HAVE_STALE_LABEL_NEW_COMMENT = {
  data: {
    repository: {
      issues: {
        nodes: [
          {
            number: 1,
            title: 'title1',
            createdAt: NOWMINUS6D,
            updatedAt: NOWMINUS1H,
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
            labeledEventsTimeline: {
              nodes: [
                {
                  __typename: 'LabeledEvent',
                  createdAt: NOWMINUS3D,
                  label: {
                    name: 'stale'
                  }
                }
              ]
            },
            issueCommentsTimeline: {
              nodes: [
                {
                  __typename: 'IssueComment',
                  createdAt: NOWMINUS1H,
                  author: {
                    login: 'user1'
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
            }
          },
          {
            number: 2,
            title: 'title2',
            createdAt: NOWMINUS6D,
            updatedAt: NOWMINUS5D,
            author: {
              login: 'user2'
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
            labeledEventsTimeline: {
              nodes: [
                {
                  __typename: 'LabeledEvent',
                  createdAt: NOWMINUS3D,
                  label: {
                    name: 'status/stale'
                  }
                }
              ]
            },
            issueCommentsTimeline: {
              nodes: [
                {
                  __typename: 'IssueComment',
                  createdAt: NOWMINUS3D,
                  author: {
                    login: 'user2'
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
