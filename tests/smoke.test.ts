import { describe, expect, it } from 'vitest';

describe('vitest setup', () => {
  it('runs under jsdom and has window', () => {
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
  });

  it('exposes chrome.storage.local mock', () => {
    expect(globalThis.chrome).toBeDefined();
    expect(typeof chrome.storage.local.get).toBe('function');
    expect(typeof chrome.storage.local.set).toBe('function');
  });

  it('chrome.i18n.getMessage returns the key by default', () => {
    expect(chrome.i18n.getMessage('hello')).toBe('hello');
  });
});
