import { describe, expect, it } from 'vitest';

describe('vitest setup', () => {
  it('runs in jsdom environment', () => {
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
  });

  it('exposes chrome mock with storage.local + i18n + tabs', () => {
    expect(chrome).toBeDefined();
    expect(chrome.storage.local).toBeDefined();
    expect(typeof chrome.storage.local.get).toBe('function');
    expect(typeof chrome.i18n.getMessage).toBe('function');
    expect(typeof chrome.tabs.query).toBe('function');
  });

  it('storage.local mock persists within a test', async () => {
    await chrome.storage.local.set({ foo: 1 });
    const result = await chrome.storage.local.get('foo');
    expect(result).toEqual({ foo: 1 });
  });

  it('storage.local mock resets between tests', async () => {
    const result = await chrome.storage.local.get('foo');
    expect(result).toEqual({});
  });
});
