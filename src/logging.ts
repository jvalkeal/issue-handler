import * as core from '@actions/core';

export function logFunctionDeprecation(oldName: string, newName: string, whenRemoved: string) {
  core.warning(`Function '${oldName}' is deprecated and will be removed in '${whenRemoved}',  use '${newName}'`);
}

export function logWarn(message: string) {
  core.warning(message);
}

export function logInfo(message: string) {
  core.info(message);
}

export function logDebug(message: string) {
  core.debug(message);
}
