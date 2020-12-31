import * as github from '@actions/github';
import { handleIfThen, IfThen } from '../src/if-then';
import { ExpressionContext } from '../src/interfaces';
import { Jexl } from 'jexl';

let called = false;

describe('if-then tests', () => {
  beforeEach(() => {
    called = false;
  });

  it('if true call then', async () => {
    const jexl = new Jexl();
    jexl.addFunction('testifthen', () => {
      called = true;
    });
    const action: IfThen = {
      if: 'true',
      then: 'testifthen()'
    };
    const expressionContext: ExpressionContext = {
      context: github.context,
      body: '',
      title: '',
      number: 1,
      actor: 'actor',
      data: {}
    };
    await handleIfThen(action, jexl, expressionContext);
    expect(called).toBeTruthy();
  });

  it('if false dont call then', async () => {
    const jexl = new Jexl();
    jexl.addFunction('testifthen', () => {
      called = true;
    });
    const action: IfThen = {
      if: 'false',
      then: 'testifthen()'
    };
    const expressionContext: ExpressionContext = {
      context: github.context,
      body: '',
      title: '',
      number: 1,
      actor: 'actor',
      data: {}
    };
    await handleIfThen(action, jexl, expressionContext);
    expect(called).toBeFalsy();
  });

  it('concept, call multiple functions as array', async () => {
    const jexl = new Jexl();
    let called1 = false;
    let called2 = false;
    jexl.addFunction('testifthen1', () => {
      called1 = true;
    });
    jexl.addFunction('testifthen2', () => {
      called2 = true;
    });
    const action: IfThen = {
      if: 'true',
      then: '[testifthen1(),testifthen2()]'
    };
    const expressionContext: ExpressionContext = {
      context: github.context,
      body: '',
      title: '',
      number: 1,
      actor: 'actor',
      data: {}
    };
    await handleIfThen(action, jexl, expressionContext);
    expect(called1).toBeTruthy();
    expect(called2).toBeTruthy();
  });
});
