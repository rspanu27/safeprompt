import { beforeEach, describe, expect, it } from 'vitest';
import { STATUS_REQUEST, isPageStatus, isStatusRequest, pageStatus } from './status';

const chatgpt = new URL('https://chatgpt.com/');

function setReadyState(state: DocumentReadyState): void {
  Object.defineProperty(document, 'readyState', { value: state, configurable: true });
}

beforeEach(() => {
  document.body.innerHTML = '';
  setReadyState('complete');
});

describe('pageStatus', () => {
  it('is watching when the message box is on the page', () => {
    document.body.innerHTML = '<textarea name="prompt"></textarea>';
    expect(pageStatus(document, chatgpt)).toBe('watching');
  });

  it('reports a loaded page with no message box', () => {
    document.body.innerHTML = '<textarea name="something-else"></textarea>';
    expect(pageStatus(document, chatgpt)).toBe('no-composer');
  });

  it('gives a page that is still loading the benefit of the doubt', () => {
    setReadyState('interactive');
    expect(pageStatus(document, chatgpt)).toBe('watching');
  });
});

describe('isStatusRequest', () => {
  it('accepts the popup request and nothing else', () => {
    expect(isStatusRequest({ type: STATUS_REQUEST })).toBe(true);
    expect(isStatusRequest({ type: 'something-else' })).toBe(false);
    expect(isStatusRequest(null)).toBe(false);
    expect(isStatusRequest(STATUS_REQUEST)).toBe(false);
  });
});

describe('isPageStatus', () => {
  it('rejects anything that is not a known status', () => {
    expect(isPageStatus('watching')).toBe(true);
    expect(isPageStatus('no-composer')).toBe(true);
    expect(isPageStatus('unreachable')).toBe(false);
    expect(isPageStatus(undefined)).toBe(false);
  });
});
