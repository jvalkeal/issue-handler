import * as core from '@actions/core';
import { inspect } from 'util';
import { Jexl } from 'jexl';
import { ExpressionContext } from './interfaces';

export async function evaluateAndLog(jexl: Jexl, expression: string, context: ExpressionContext): Promise<any> {
  return jexl.eval(expression, context).then(
    value => {
      core.info(`OK '${expression}' => ${inspect(value)}`);
      return value;
    },
    error => {
      core.error(`FAIL '${expression}' => ${inspect(error)}`);
      return error;
    }
  );
}

export function isResultTruthy(result: any): boolean {
  if (Array.isArray(result)) {
    return (result as any[]).length > 0;
  } else {
    return Boolean(result);
  }
}

export function resultAsStringArray(result: any): string[] {
  if (Array.isArray(result)) {
    return result as string[];
  } else if (typeof result === 'string') {
    return [result];
  }
  return [];
}
