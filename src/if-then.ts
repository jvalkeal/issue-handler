import * as core from '@actions/core';
import { inspect } from 'util';
import { Jexl } from 'jexl';
import { ExpressionContext } from './interfaces';
import { evaluateAndLog } from './jexl-utils';

/**
 * Type of if/then logic.
 */
export interface IfThen {
  if: string;
  then: string;
}

/**
 * Handling logic of 'ifThen'.
 */
export async function handleIfThen(recipe: IfThen, jexl: Jexl, expressionContext: ExpressionContext): Promise<void> {
  core.debug(`handleIfThen ${inspect(recipe)}`);
  const retIf = await evaluateAndLog(jexl, recipe.if, expressionContext);
  core.info(`if => ${inspect(retIf)}`);
  if (retIf === true) {
    const retThen = await evaluateAndLog(jexl, recipe.then, expressionContext);
    core.info(`then => ${inspect(retThen)}`);
  }
}
