import { Jexl } from 'jexl';
import { addJexlFunctions } from '../src/jexl-functions';
import { CONTEXT_UNLABELED_ISSUE } from './mock-data';
import * as githubUtils from '../src/github-utils';

let jexl: Jexl;

describe('jexl-functions tests', () => {
  beforeEach(() => {
    jexl = new Jexl();
  });

  it('labelsContainsAll returns true if label match', async () => {
    addJexlFunctions(jexl, 'token', CONTEXT_UNLABELED_ISSUE);
    let result: boolean = await jexl.eval('labelsContainsAll(["for/backport"])');
    expect(result).toBeTruthy();
    result = await jexl.eval('labelsContainsAll("for/backport")');
    expect(result).toBeTruthy();
  });

  it('labelsContainsAll returns false if no label match', async () => {
    addJexlFunctions(jexl, 'token', CONTEXT_UNLABELED_ISSUE);
    let result: boolean = await jexl.eval('labelsContainsAll(["nolabel"])');
    expect(result).toBeFalsy();
    result = await jexl.eval('labelsContainsAll("nolabel")');
    expect(result).toBeFalsy();
    result = await jexl.eval('labelsContainsAll(["nolabel", "for/backport"])');
    expect(result).toBeFalsy();
  });

  it('labelsContainsAny returns true if label match', async () => {
    addJexlFunctions(jexl, 'token', CONTEXT_UNLABELED_ISSUE);
    let result: boolean = await jexl.eval('labelsContainsAny(["for/backport"])');
    expect(result).toBeTruthy();
    result = await jexl.eval('labelsContainsAny("for/backport")');
    expect(result).toBeTruthy();
    result = await jexl.eval('labelsContainsAny(["nolabel", "for/backport"])');
    expect(result).toBeTruthy();
  });

  it('labelsContainsAny returns false if no label match', async () => {
    addJexlFunctions(jexl, 'token', CONTEXT_UNLABELED_ISSUE);
    let result: boolean = await jexl.eval('labelsContainsAny(["nolabel"])');
    expect(result).toBeFalsy();
    result = await jexl.eval('labelsContainsAny("nolabel")');
    expect(result).toBeFalsy();
  });

  it('isEvent returns true if event is', async () => {
    addJexlFunctions(jexl, 'token', CONTEXT_UNLABELED_ISSUE);
    const result: boolean = await jexl.eval('isEvent("issues")');
    expect(result).toBeTruthy();
  });

  it('isAction returns true if event is', async () => {
    addJexlFunctions(jexl, 'token', CONTEXT_UNLABELED_ISSUE);
    const result: boolean = await jexl.eval('isAction("unlabeled")');
    expect(result).toBeTruthy();
  });

  it('isMilestone returns false if no milestone', async () => {
    addJexlFunctions(jexl, 'token', CONTEXT_UNLABELED_ISSUE);
    const result: boolean = await jexl.eval('isMilestone()');
    expect(result).toBeFalsy();
  });

  it('hasLabels returns true if labels contains', async () => {
    addJexlFunctions(jexl, 'token', CONTEXT_UNLABELED_ISSUE);
    const result: boolean = await jexl.eval('hasLabels(["area/core"])');
    expect(result).toBeTruthy();
  });

  it('labelIssue calls with correct arguments from array', async () => {
    addJexlFunctions(jexl, 'token', CONTEXT_UNLABELED_ISSUE);
    const spy = jest
      .spyOn(githubUtils, 'addLabelsToIssue')
      .mockImplementation((token: string, owner: string, repo: string, issue_number: number, labels: string[]) => {
        return Promise.resolve();
      });
    await jexl.eval('labelIssue(["area/core"])');
    expect(spy).toHaveBeenCalledWith('token', 'owner', 'repo', 1, ['area/core']);
  });

  it('labelIssue calls with correct arguments from string', async () => {
    addJexlFunctions(jexl, 'token', CONTEXT_UNLABELED_ISSUE);
    const spy = jest
      .spyOn(githubUtils, 'addLabelsToIssue')
      .mockImplementation((token: string, owner: string, repo: string, issue_number: number, labels: string[]) => {
        return Promise.resolve();
      });
    await jexl.eval('labelIssue("area/core")');
    expect(spy).toHaveBeenCalledWith('token', 'owner', 'repo', 1, ['area/core']);
  });
});
