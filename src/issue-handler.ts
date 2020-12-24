import * as core from '@actions/core';
import { inspect } from 'util';
import { handleIssue } from './handler';

async function run() {
  try {
    const issueHandlerToken = inputRequired('token');
    const issueHandlerConfig = inputRequired('config');
    core.startGroup('Issue Handler');
    await handleIssue(issueHandlerToken, issueHandlerConfig);
    core.endGroup();
  } catch (error) {
    core.debug(inspect(error));
    core.setFailed(error.message);
  }
}

function inputRequired(id: string): string {
  return core.getInput(id, { required: true });
}

run();
