import * as core from '@actions/core';
import * as github from '@actions/github';
import { inspect } from 'util';
import { Jexl } from 'jexl';
import { ExpressionContext, RecipeType, IssueHandlerConfig, JSONObject } from './interfaces';
import { addJexlFunctions } from './jexl-functions';
import { handleIfThen } from './if-then';
import { handleManageBackportIssues } from './manage-backport-issues';

/**
 * Main handle function which takes a json config, processes it
 * and then calls various recipes in it.
 */
export async function handleIssue(token: string, config: string): Promise<void> {
  core.debug(`github context: ${inspect(github.context, true, 10)}`);
  const configs = getHandlerConfigFromJson(config);

  const data: JSONObject = configs.data || {};
  const expressionContext: ExpressionContext = {
    context: github.context,
    title: github.context.payload.issue?.title,
    body: github.context.payload.issue?.body || '',
    number: github.context.issue.number,
    actor: github.context.actor,
    data
  };
  const jexl = new Jexl();
  addJexlFunctions(jexl, token, github.context, data);

  // validate
  for (const recipe of configs.recipes) {
    const recipeType: RecipeType = RecipeType[recipe.type];
    if (recipeType === undefined) {
      throw new Error(`Invalid recipe type '${recipe.type}'`);
    }
  }

  for (const recipe of configs.recipes) {
    const name = recipe.name || 'unnamed';
    core.info(`Processing recipe '${name}' with type '${recipe.type}'`);
    switch (recipe.type) {
      case RecipeType.ifThen:
        await handleIfThen(recipe, jexl, expressionContext);
        break;
      case RecipeType.manageBackportIssues:
        await handleManageBackportIssues(recipe, jexl, expressionContext, token);
        break;
      default:
        break;
    }
  }
}

/**
 * Parses raw config json into {@ IssueHandlerConfig}.
 */
function getHandlerConfigFromJson(json: string): IssueHandlerConfig {
  const jsonConfig: IssueHandlerConfig = JSON.parse(json);
  core.debug(`JSON config: ${inspect(jsonConfig)}`);
  return jsonConfig;
}
