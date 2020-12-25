import { Jexl } from 'jexl';
import { addJexlFunctions } from '../src/jexl-functions';
import { CONTEXT_UNLABELED_ISSUE } from './mock-data';

let jexl: Jexl;

describe('jexl-functions tests', () => {
  beforeEach(() => {
    jexl = new Jexl();
  });

  it('containsLabels returns true if label match', async () => {
    addJexlFunctions(jexl, 'token', CONTEXT_UNLABELED_ISSUE);
    const result: boolean = await jexl.eval('containsLabels(["for/backport"])');
    expect(result).toBeTruthy();
  });

  it('containsLabels returns false if no label match', async () => {
    addJexlFunctions(jexl, 'token', CONTEXT_UNLABELED_ISSUE);
    const result: boolean = await jexl.eval('containsLabels(["nolabel"])');
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
});
