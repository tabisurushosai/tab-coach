import { logger } from '@/lib/logger';
import { countAllTabs } from '@/lib/tabs';

chrome.runtime.onInstalled.addListener((details) => {
  logger.info('onInstalled', {
    reason: details.reason,
    previousVersion: details.previousVersion ?? null,
  });
});

chrome.runtime.onStartup.addListener(() => {
  logger.info('onStartup');
});

chrome.tabs.onCreated.addListener((tab) => {
  countAllTabs()
    .then((count) => {
      logger.info('tabs.onCreated', {
        tabId: tab.id ?? null,
        windowId: tab.windowId ?? null,
        url: tab.url ?? tab.pendingUrl ?? '',
        total: count,
      });
    })
    .catch((err) => {
      logger.error('tabs.onCreated countAllTabs failed', err);
    });
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  countAllTabs()
    .then((count) => {
      logger.info('tabs.onRemoved', {
        tabId,
        windowId: removeInfo.windowId,
        isWindowClosing: removeInfo.isWindowClosing,
        total: count,
      });
    })
    .catch((err) => {
      logger.error('tabs.onRemoved countAllTabs failed', err);
    });
});
