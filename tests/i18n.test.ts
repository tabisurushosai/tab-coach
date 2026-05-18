import { describe, expect, it, vi } from 'vitest';
import { applyI18nToDom, getUILocale, t, type MessageKey } from '@/lib/i18n';

describe('i18n wrapper', () => {
  describe('t', () => {
    it('returns the message from chrome.i18n.getMessage for a known key', () => {
      vi.mocked(chrome.i18n.getMessage).mockImplementationOnce(() => 'Tab Coach');
      expect(t('extension_name')).toBe('Tab Coach');
      expect(chrome.i18n.getMessage).toHaveBeenCalledWith('extension_name');
    });

    it('passes a single substitution string through to chrome.i18n.getMessage', () => {
      vi.mocked(chrome.i18n.getMessage).mockImplementationOnce(
        (_key, subs) => `formatted:${subs as string}`,
      );
      const result = t('popup_undo_countdown_format', '12');
      expect(result).toBe('formatted:12');
      expect(chrome.i18n.getMessage).toHaveBeenCalledWith('popup_undo_countdown_format', '12');
    });

    it('passes an array of substitutions through to chrome.i18n.getMessage', () => {
      vi.mocked(chrome.i18n.getMessage).mockImplementationOnce(
        (_key, subs) => `joined:${(subs as string[]).join('|')}`,
      );
      const result = t('report_saved_time_format', ['1', '23']);
      expect(result).toBe('joined:1|23');
      expect(chrome.i18n.getMessage).toHaveBeenCalledWith('report_saved_time_format', ['1', '23']);
    });

    it('returns the missing-message placeholder when getMessage returns ""', () => {
      vi.mocked(chrome.i18n.getMessage).mockImplementationOnce(() => '');
      expect(t('cleanup_button')).toBe('??cleanup_button??');
    });

    it('returns the missing-message placeholder when chrome is undefined', () => {
      const original = (globalThis as unknown as { chrome: unknown }).chrome;
      (globalThis as unknown as { chrome: unknown }).chrome = undefined;
      try {
        expect(t('extension_description')).toBe('??extension_description??');
      } finally {
        (globalThis as unknown as { chrome: unknown }).chrome = original;
      }
    });

    it('returns the missing-message placeholder when chrome.i18n is undefined', () => {
      const original = chrome.i18n;
      (chrome as unknown as { i18n: unknown }).i18n = undefined;
      try {
        expect(t('extension_name')).toBe('??extension_name??');
      } finally {
        (chrome as unknown as { i18n: unknown }).i18n = original;
      }
    });

    it('returns the missing-message placeholder when getMessage is not a function', () => {
      const original = chrome.i18n.getMessage;
      (chrome.i18n as unknown as { getMessage: unknown }).getMessage = undefined;
      try {
        expect(t('cleanup_button')).toBe('??cleanup_button??');
      } finally {
        (chrome.i18n as unknown as { getMessage: unknown }).getMessage = original;
      }
    });
  });

  describe('getUILocale', () => {
    it('returns "ja" when chrome.i18n.getUILanguage starts with ja', () => {
      vi.mocked(chrome.i18n.getUILanguage).mockReturnValueOnce('ja');
      expect(getUILocale()).toBe('ja');
    });

    it('returns "ja" for ja-JP regional variant', () => {
      vi.mocked(chrome.i18n.getUILanguage).mockReturnValueOnce('ja-JP');
      expect(getUILocale()).toBe('ja');
    });

    it('returns "ja" regardless of case (JA-JP)', () => {
      vi.mocked(chrome.i18n.getUILanguage).mockReturnValueOnce('JA-JP');
      expect(getUILocale()).toBe('ja');
    });

    it('returns "en" for English locale', () => {
      vi.mocked(chrome.i18n.getUILanguage).mockReturnValueOnce('en-US');
      expect(getUILocale()).toBe('en');
    });

    it('returns "en" for any non-ja locale (fr)', () => {
      vi.mocked(chrome.i18n.getUILanguage).mockReturnValueOnce('fr-FR');
      expect(getUILocale()).toBe('en');
    });

    it('returns "en" when chrome is undefined', () => {
      const original = (globalThis as unknown as { chrome: unknown }).chrome;
      (globalThis as unknown as { chrome: unknown }).chrome = undefined;
      try {
        expect(getUILocale()).toBe('en');
      } finally {
        (globalThis as unknown as { chrome: unknown }).chrome = original;
      }
    });

    it('returns "en" when getUILanguage is not a function', () => {
      const original = chrome.i18n.getUILanguage;
      (chrome.i18n as unknown as { getUILanguage: unknown }).getUILanguage = undefined;
      try {
        expect(getUILocale()).toBe('en');
      } finally {
        (chrome.i18n as unknown as { getUILanguage: unknown }).getUILanguage = original;
      }
    });
  });

  describe('applyI18nToDom', () => {
    it('sets textContent on elements with data-i18n attributes', () => {
      vi.mocked(chrome.i18n.getMessage).mockImplementation((key: string) => `MSG:${key}`);
      const root = document.createElement('div');
      root.innerHTML = `
        <button data-i18n="cleanup_button">placeholder</button>
        <span data-i18n="undo_button">placeholder</span>
      `;
      applyI18nToDom(root);
      const button = root.querySelector('button');
      const span = root.querySelector('span');
      expect(button?.textContent).toBe('MSG:cleanup_button');
      expect(span?.textContent).toBe('MSG:undo_button');
    });

    it('ignores elements with an empty data-i18n value', () => {
      vi.mocked(chrome.i18n.getMessage).mockImplementation((key: string) => `MSG:${key}`);
      const root = document.createElement('div');
      const el = document.createElement('span');
      el.setAttribute('data-i18n', '');
      el.textContent = 'original';
      root.appendChild(el);
      applyI18nToDom(root);
      expect(el.textContent).toBe('original');
    });

    it('sets attributes specified by data-i18n-attr (single pair)', () => {
      vi.mocked(chrome.i18n.getMessage).mockImplementation((key: string) => `MSG:${key}`);
      const root = document.createElement('div');
      const btn = document.createElement('button');
      btn.setAttribute('data-i18n-attr', 'aria-label:cleanup_button_aria_label');
      root.appendChild(btn);
      applyI18nToDom(root);
      expect(btn.getAttribute('aria-label')).toBe('MSG:cleanup_button_aria_label');
    });

    it('sets multiple attributes specified by data-i18n-attr (comma separated)', () => {
      vi.mocked(chrome.i18n.getMessage).mockImplementation((key: string) => `MSG:${key}`);
      const root = document.createElement('div');
      const input = document.createElement('input');
      input.setAttribute(
        'data-i18n-attr',
        'placeholder:search_placeholder, aria-label:popup_tab_list_aria_label',
      );
      root.appendChild(input);
      applyI18nToDom(root);
      expect(input.getAttribute('placeholder')).toBe('MSG:search_placeholder');
      expect(input.getAttribute('aria-label')).toBe('MSG:popup_tab_list_aria_label');
    });

    it('ignores malformed data-i18n-attr entries missing attr or key', () => {
      vi.mocked(chrome.i18n.getMessage).mockImplementation((key: string) => `MSG:${key}`);
      const root = document.createElement('div');
      const el = document.createElement('button');
      el.setAttribute('data-i18n-attr', 'broken, :empty_attr, only_key:');
      root.appendChild(el);
      applyI18nToDom(root);
      expect(el.getAttributeNames().sort()).toEqual(['data-i18n-attr']);
    });

    it('applies to document by default when no root is provided', () => {
      vi.mocked(chrome.i18n.getMessage).mockImplementation((key: string) => `MSG:${key}`);
      const el = document.createElement('span');
      el.setAttribute('data-i18n', 'undo_button');
      document.body.appendChild(el);
      try {
        applyI18nToDom();
        expect(el.textContent).toBe('MSG:undo_button');
      } finally {
        el.remove();
      }
    });

    it('writes the missing placeholder when getMessage returns ""', () => {
      vi.mocked(chrome.i18n.getMessage).mockImplementation(() => '');
      const root = document.createElement('div');
      const el = document.createElement('span');
      const key: MessageKey = 'cleanup_button';
      el.setAttribute('data-i18n', key);
      root.appendChild(el);
      applyI18nToDom(root);
      expect(el.textContent).toBe(`??${key}??`);
    });
  });
});
