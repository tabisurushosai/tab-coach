import { logger } from '@/lib/logger';
import { refreshBadge } from '@/lib/badge';
import { isReadingProgressMessage } from '@/types/messages';
import { isReadCompleted, markReadCompleted } from '@/lib/reading';
import { getMany } from '@/lib/storage';
import { filterInactive, queryAllSnapshots } from '@/lib/tabs';
import { matchesWhitelist } from '@/lib/whitelist';
import { createUndoSnapshot, saveUndoSnapshot, clearUndoSnapshot } from '@/lib/snapshot';
import { recordCleanup } from '@/lib/report';

const CLEANUP_COMMAND = 'cleanup-tabs';

async function runShortcutCleanup(): Promise<void> {
  const [snapshots, stored] = await Promise.all([
    queryAllSnapshots(),
    getMany(['settings', 'whitelist'] as const),
  ]);
  const candidates = filterInactive(snapshots, stored.settings.inactiveMinutes);
  const targets = candidates.filter(
    (s) => s.id >= 0 && s.pinned !== true && !matchesWhitelist(s.url, stored.whitelist),
  );
  if (targets.length === 0) {
    logger.info('shortcut.cleanup.noop', { total: snapshots.length });
    return;
  }
  const undo = createUndoSnapshot(targets);
  await saveUndoSnapshot(undo);
  const ids = targets.map((t) => t.id);
  try {
    await chrome.tabs.remove(ids);
  } catch (err) {
    logger.error('shortcut.cleanup remove failed', err);
    try {
      await clearUndoSnapshot();
    } catch (rollbackErr) {
      logger.error('shortcut.cleanup undo rollback failed', rollbackErr);
    }
    return;
  }
  try {
    await recordCleanup(targets.length, 'inactive');
  } catch (err) {
    logger.error('shortcut.cleanup recordCleanup failed', err);
  }
  logger.info('shortcut.cleanup.done', { closed: targets.length });
}

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

if (chrome.commands?.onCommand) {
  chrome.commands.onCommand.addListener((command) => {
    if (command !== CLEANUP_COMMAND) return;
    runShortcutCleanup().catch((err) =>
      logger.error('runShortcutCleanup failed', err),
    );
  });
}

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
