import { Context } from '@actions/github/lib/context';
import { IfThen } from './if-then';
import { ManageBackportIssues } from './manage-backport-issues';

/**
 * Used jexl expression context with evaluation.
 */
export interface ExpressionContext {
  context: Context;
  title: string;
  body: string;
  number: number;
}

/**
 * Type of a config user can define as json in an action yml.
 */
export interface IssueHandlerConfig {
  recipes: Recipe[];
}

/**
 * Enumeration of possible recipe types.
 */
export enum RecipeType {
  ifThen = 'ifThen',
  manageBackportIssues = 'manageBackportIssues'
}

/**
 * Define possible recipes with recipe types.
 */
export type Recipe =
  | ({ name: string; type: RecipeType.ifThen } & IfThen)
  | ({ name: string; type: RecipeType.manageBackportIssues } & ManageBackportIssues);
