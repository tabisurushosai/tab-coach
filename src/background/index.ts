import { logger } from '@/lib/logger';

chrome.runtime.onInstalled.addListener((details) => {
  logger.info('onInstalled', {
    reason: details.reason,
    previousVersion: details.previousVersion ?? null,
  });
});

chrome.runtime.onStartup.addListener(() => {
  logger.info('onStartup');
});
