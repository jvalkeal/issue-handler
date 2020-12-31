import { Jexl } from 'jexl';
import { addJexlFunctions } from '../src/jexl-functions';
import { CONTEXT_UNLABELED_ISSUE } from './mock-data';
import * as githubUtils from '../src/github-utils';
import { ExpressionContext } from '../src/interfaces';

let jexl: Jexl;

describe('jexl-functions tests', () => {
  const EC_UNLABELED: ExpressionContext = {
    context: CONTEXT_UNLABELED_ISSUE,
    body: 'fake body',
    title: 'fake title',
    number: 1,
    actor: 'actor',
    data: {}
  };

  beforeEach(() => {
    jexl = new Jexl();
  });

  it('labelsContainsAll returns true if label match', async () => {
    addJexlFunctions(jexl, 'token', CONTEXT_UNLABELED_ISSUE, {});
    let result: boolean = await jexl.eval('labelsContainsAll(["for/backport"])');
    expect(result).toBeTruthy();
    result = await jexl.eval('labelsContainsAll("for/backport")');
    expect(result).toBeTruthy();
  });

  it('labelsContainsAll returns false if no label match', async () => {
    addJexlFunctions(jexl, 'token', CONTEXT_UNLABELED_ISSUE, {});
    let result: boolean = await jexl.eval('labelsContainsAll(["nolabel"])');
    expect(result).toBeFalsy();
    result = await jexl.eval('labelsContainsAll("nolabel")');
    expect(result).toBeFalsy();
    result = await jexl.eval('labelsContainsAll(["nolabel", "for/backport"])');
    expect(result).toBeFalsy();
  });

  it('labelsContainsAny returns true if label match', async () => {
    addJexlFunctions(jexl, 'token', CONTEXT_UNLABELED_ISSUE, {});
    let result: boolean = await jexl.eval('labelsContainsAny(["for/backport"])');
    expect(result).toBeTruthy();
    result = await jexl.eval('labelsContainsAny("for/backport")');
    expect(result).toBeTruthy();
    result = await jexl.eval('labelsContainsAny(["nolabel", "for/backport"])');
    expect(result).toBeTruthy();
  });

  it('labelsContainsAny returns false if no label match', async () => {
    addJexlFunctions(jexl, 'token', CONTEXT_UNLABELED_ISSUE, {});
    let result: boolean = await jexl.eval('labelsContainsAny(["nolabel"])');
    expect(result).toBeFalsy();
    result = await jexl.eval('labelsContainsAny("nolabel")');
    expect(result).toBeFalsy();
    result = await jexl.eval('labelsContainsAny("no/nolabel")');
    expect(result).toBeFalsy();
  });

  it('isEvent returns true if event is', async () => {
    addJexlFunctions(jexl, 'token', CONTEXT_UNLABELED_ISSUE, {});
    const result: boolean = await jexl.eval('isEvent("issues")');
    expect(result).toBeTruthy();
  });

  it('isAction returns true if event is', async () => {
    addJexlFunctions(jexl, 'token', CONTEXT_UNLABELED_ISSUE, {});
    const result: boolean = await jexl.eval('isAction("unlabeled")');
    expect(result).toBeTruthy();
  });

  it('isMilestone returns false if no milestone', async () => {
    addJexlFunctions(jexl, 'token', CONTEXT_UNLABELED_ISSUE, {});
    const result: boolean = await jexl.eval('isMilestone()');
    expect(result).toBeFalsy();
  });

  it('hasLabels returns true if labels contains', async () => {
    addJexlFunctions(jexl, 'token', CONTEXT_UNLABELED_ISSUE, {});
    const result: boolean = await jexl.eval('hasLabels(["area/core"])');
    expect(result).toBeTruthy();
  });

  it('labelIssue calls with correct arguments from array', async () => {
    addJexlFunctions(jexl, 'token', CONTEXT_UNLABELED_ISSUE, {});
    const spy = jest
      .spyOn(githubUtils, 'addLabelsToIssue')
      .mockImplementation((token: string, owner: string, repo: string, issue_number: number, labels: string[]) => {
        return Promise.resolve();
      });
    await jexl.eval('labelIssue(["area/core"])');
    expect(spy).toHaveBeenCalledWith('token', 'owner', 'repo', 1, ['area/core']);
  });

  it('labelIssue calls with correct arguments from string', async () => {
    addJexlFunctions(jexl, 'token', CONTEXT_UNLABELED_ISSUE, {});
    const spy = jest
      .spyOn(githubUtils, 'addLabelsToIssue')
      .mockImplementation((token: string, owner: string, repo: string, issue_number: number, labels: string[]) => {
        return Promise.resolve();
      });
    await jexl.eval('labelIssue("area/core")');
    expect(spy).toHaveBeenCalledWith('token', 'owner', 'repo', 1, ['area/core']);
  });

  it('jexl expression can find item from array', async () => {
    const c: ExpressionContext = {
      context: CONTEXT_UNLABELED_ISSUE,
      body: 'fake body',
      title: 'fake title',
      number: 1,
      actor: 'user4',
      data: {
        contributors: ['user1', 'user2']
      }
    };
    const match1 = await jexl.eval("'user1' in data.contributors", c);
    expect(match1).toBeTruthy();
    const match2 = await jexl.eval("'user3' in data.contributors", c);
    expect(match2).toBeFalsy();
  });

  it('removeLabel calls with correct arguments from array', async () => {
    addJexlFunctions(jexl, 'token', CONTEXT_UNLABELED_ISSUE, {});
    const spy = jest
      .spyOn(githubUtils, 'removeLabelFromIssue')
      .mockImplementation((token: string, owner: string, repo: string, issue_number: number, labels: string[]) => {
        return Promise.resolve();
      });
    await jexl.eval('removeLabel(["area/core"])');
    expect(spy).toHaveBeenCalledWith('token', 'owner', 'repo', 1, ['area/core']);
  });

  it('removeLabel calls with correct arguments from string', async () => {
    addJexlFunctions(jexl, 'token', CONTEXT_UNLABELED_ISSUE, {});
    const spy = jest
      .spyOn(githubUtils, 'removeLabelFromIssue')
      .mockImplementation((token: string, owner: string, repo: string, issue_number: number, labels: string[]) => {
        return Promise.resolve();
      });
    await jexl.eval('removeLabel("area/core")');
    expect(spy).toHaveBeenCalledWith('token', 'owner', 'repo', 1, ['area/core']);
  });

  it('dataInArray works correctly', async () => {
    addJexlFunctions(jexl, 'token', CONTEXT_UNLABELED_ISSUE, { contributors: ['user1', 'user2'] });
    let result: boolean = await jexl.eval("dataInArray('contributors', 'user1')");
    expect(result).toBeTruthy();
    result = await jexl.eval("dataInArray('contributors', 'user3')");
    expect(result).toBeFalsy();
    result = await jexl.eval("dataInArray('contributors', actor)", EC_UNLABELED);
    expect(result).toBeFalsy();
  });

  it('dataInArray works correctly with actor', async () => {
    addJexlFunctions(jexl, 'token', CONTEXT_UNLABELED_ISSUE, { contributors: ['actor', 'user2'] });
    let result: boolean = await jexl.eval("dataInArray('contributors', actor)", EC_UNLABELED);
    expect(result).toBeTruthy();
  });
});
