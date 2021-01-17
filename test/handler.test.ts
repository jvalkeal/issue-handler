import * as github from '@actions/github';
import { handleIssue } from '../src/handler';

const originalGitHubWorkspace = process.env['GITHUB_WORKSPACE'];
const originalGitHubRepository = process.env['GITHUB_REPOSITORY'];
let originalContext = { ...github.context };

describe('handler tests', () => {
  beforeAll(async () => {
    process.env['GITHUB_REPOSITORY'] = 'owner/repo';
  }, 300000);

  afterAll(async () => {
    delete process.env['GITHUB_WORKSPACE'];
    if (originalGitHubWorkspace) {
      process.env['GITHUB_WORKSPACE'] = originalGitHubWorkspace;
    }
    delete process.env['GITHUB_REPOSITORY'];
    if (originalGitHubRepository) {
      process.env['GITHUB_REPOSITORY'] = originalGitHubRepository;
    }

    github.context.ref = originalContext.ref;
    github.context.sha = originalContext.sha;
  }, 100000);

  it('wrong type throws error', async () => {
    const config1 = `
      {
        "recipes": [
          {
            "type": "wrong"
          }
        ]
      }
    `;
    const config2 = `
      {
        "recipes": [
          {
            "type": "ifThen",
            "if": "'true'"
          }
        ]
      }
    `;

    await expect(handleIssue('token', config1, true)).rejects.toThrow("Invalid recipe type 'wrong'");
    await handleIssue('token', config2, true);
  });
});
