import { applyI18nToDom } from '@/lib/i18n';
import { logger } from '@/lib/logger';

function init(): void {
  applyI18nToDom(document);
  logger.info('options loaded');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
