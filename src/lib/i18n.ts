export type MessageKey = 'extension_name' | 'extension_description';

export type Locale = 'ja' | 'en';

const PLACEHOLDER_MISSING = (key: string): string => `??${key}??`;

function isChromeI18nAvailable(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    typeof chrome.i18n !== 'undefined' &&
    typeof chrome.i18n.getMessage === 'function'
  );
}

export function t(key: MessageKey, substitutions?: string | readonly string[]): string {
  if (!isChromeI18nAvailable()) {
    return PLACEHOLDER_MISSING(key);
  }
  const subs = substitutions === undefined ? undefined : (substitutions as string | string[]);
  const message = subs === undefined ? chrome.i18n.getMessage(key) : chrome.i18n.getMessage(key, subs);
  return message === '' ? PLACEHOLDER_MISSING(key) : message;
}

export function getUILocale(): Locale {
  if (!isChromeI18nAvailable() || typeof chrome.i18n.getUILanguage !== 'function') {
    return 'en';
  }
  const lang = chrome.i18n.getUILanguage();
  return lang.toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

export function applyI18nToDom(root: ParentNode = document): void {
  const nodes = root.querySelectorAll<HTMLElement>('[data-i18n]');
  nodes.forEach((el) => {
    const key = el.dataset['i18n'];
    if (!key) return;
    el.textContent = t(key as MessageKey);
  });
  const attrNodes = root.querySelectorAll<HTMLElement>('[data-i18n-attr]');
  attrNodes.forEach((el) => {
    const spec = el.dataset['i18nAttr'];
    if (!spec) return;
    spec.split(',').forEach((pair) => {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      if (!attr || !key) return;
      el.setAttribute(attr, t(key as MessageKey));
    });
  });
}
