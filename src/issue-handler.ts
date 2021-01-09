import * as core from '@actions/core';
import { inspect } from 'util';
import { handleIssue } from './handler';

async function run() {
  try {
    const issueHandlerToken = inputRequired('token');
    const issueHandlerConfig = inputRequired('config');
    const issueHandlerDryRun = Boolean(inputNotRequired('dry-run'));
    core.startGroup('Issue Handler');
    core.info('Enabling dry-run mode, no changes will be made');
    await handleIssue(issueHandlerToken, issueHandlerConfig, issueHandlerDryRun);
    core.endGroup();
  } catch (error) {
    core.debug(inspect(error));
    core.setFailed(error.message);
  }
}

function inputRequired(id: string): string {
  return core.getInput(id, { required: true });
}

function inputNotRequired(id: string): string {
  return core.getInput(id, { required: false });
}

run();
