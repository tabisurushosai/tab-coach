import { logger } from '@/lib/logger';
import { refreshBadge } from '@/lib/badge';
import { isReadingProgressMessage } from '@/types/messages';
import { isReadCompleted, markReadCompleted } from '@/lib/reading';

async function updateBadgeAndLog(event: string, extra: Record<string, unknown>): Promise<void> {
  try {
    const total = await refreshBadge();
    logger.info(event, { ...extra, total });
  } catch (err) {
    logger.error(`${event} refreshBadge failed`, err);
  }
}

chrome.runtime.onInstalled.addListener((details) => {
  logger.info('onInstalled', {
    reason: details.reason,
    previousVersion: details.previousVersion ?? null,
  });
  void updateBadgeAndLog('onInstalled.badge', {});
});

chrome.runtime.onStartup.addListener(() => {
  logger.info('onStartup');
  void updateBadgeAndLog('onStartup.badge', {});
});

chrome.tabs.onCreated.addListener((tab) => {
  void updateBadgeAndLog('tabs.onCreated', {
    tabId: tab.id ?? null,
    windowId: tab.windowId ?? null,
    url: tab.url ?? tab.pendingUrl ?? '',
  });
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  void updateBadgeAndLog('tabs.onRemoved', {
    tabId,
    windowId: removeInfo.windowId,
    isWindowClosing: removeInfo.isWindowClosing,
  });
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (isReadingProgressMessage(message)) {
    const completed = isReadCompleted(message.maxScrollPercent, message.dwellMs);
    logger.info('READING_PROGRESS', {
      tabId: sender.tab?.id ?? null,
      frameId: sender.frameId ?? null,
      url: message.url,
      maxScrollPercent: message.maxScrollPercent,
      dwellMs: message.dwellMs,
      reportedAt: message.reportedAt,
      completed,
    });
    if (completed) {
      markReadCompleted(message.url, message.reportedAt)
        .then((key) => {
          if (key !== null) {
            logger.info('READING_PROGRESS.markCompleted', { key });
          }
        })
        .catch((err) => logger.error('markReadCompleted failed', err));
    }
  }
  return false;
});
