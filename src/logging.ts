import * as core from '@actions/core';

export function logFunctionDeprecation(oldName: string, newName: string, whenRemoved: string) {
  core.warning(`Function '${oldName}' is deprecated and will be removed in '${whenRemoved}',  use '${newName}'`);
}
