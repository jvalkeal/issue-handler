import * as core from '@actions/core';
import { Jexl } from "jexl";
import { inspect } from 'util';
import { simpleQuery } from './github-graphql-utils';
import { ExpressionContext } from "./interfaces";

export interface StaleIssues {}

export async function handleStaleIssues(
  recipe: StaleIssues,
  jexl: Jexl,
  expressionContext: ExpressionContext,
  token: string
) {
  core.info(`Doing simpleQuery`);
  const data = await simpleQuery(token);
  core.info(`Result simpleQuery ${inspect(data, true, 10)}`);
}
