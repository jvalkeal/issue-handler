import { Context } from '@actions/github/lib/context';
import { IfThen } from './if-then';
import { ManageBackportIssues } from './manage-backport-issues';
import { StaleIssues } from './stale-issues';

export type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;
export type JSONObject = { [member: string]: JSONValue };
export type JSONArray = JSONValue[];

/**
 * Used jexl expression context with evaluation.
 */
export interface ExpressionContext {
  context: Context;
  title: string;
  body: string;
  number: number;
  actor: string;
  data: JSONObject;
}

/**
 * Type of a config user can define as json in an action yml.
 */
export interface IssueHandlerConfig {
  recipes: Recipe[];
  data?: JSONObject;
}

/**
 * Enumeration of possible recipe types.
 */
export enum RecipeType {
  ifThen = 'ifThen',
  manageBackportIssues = 'manageBackportIssues',
  staleIssues = 'staleIssues'
}

/**
 * Define possible recipes with recipe types.
 */
export type Recipe =
  | ({ name: string; type: RecipeType.ifThen } & IfThen)
  | ({ name: string; type: RecipeType.manageBackportIssues } & ManageBackportIssues)
  | ({ name: string; type: RecipeType.staleIssues } & StaleIssues);
