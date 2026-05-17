import { getHostname, queryAllTabs } from '@/lib/tabs';
import { logger } from '@/lib/logger';

export type GroupingError = 'unavailable' | 'no_candidates';

export type GroupingResult = {
  groupsCreated: number;
  tabsGrouped: number;
};

export type GroupingOutcome =
  | { ok: true; result: GroupingResult }
  | { ok: false; reason: GroupingError };

export const TAB_GROUP_COLORS = [
  'blue',
  'green',
  'purple',
  'cyan',
  'orange',
  'pink',
  'yellow',
  'red',
] as const;

export type TabGroupColor = (typeof TAB_GROUP_COLORS)[number];

type TabGroupsApi = {
  update: (id: number, props: { title?: string; color?: TabGroupColor }) => Promise<unknown>;
};

function isTabsGroupAvailable(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    typeof chrome.tabs !== 'undefined' &&
    typeof chrome.tabs.group === 'function'
  );
}

function getTabGroupsApi(): TabGroupsApi | null {
  if (typeof chrome === 'undefined') return null;
  const candidate = (chrome as unknown as { tabGroups?: unknown }).tabGroups;
  if (!candidate || typeof candidate !== 'object') return null;
  const update = (candidate as { update?: unknown }).update;
  if (typeof update !== 'function') return null;
  return candidate as TabGroupsApi;
}

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function pickColorForDomain(domain: string): TabGroupColor {
  const idx = hashString(domain) % TAB_GROUP_COLORS.length;
  return TAB_GROUP_COLORS[idx]!;
}

export type WindowDomainBuckets = Map<number, Map<string, number[]>>;

export function bucketTabsByWindowAndHostname(
  tabs: readonly chrome.tabs.Tab[],
): WindowDomainBuckets {
  const buckets: WindowDomainBuckets = new Map();
  for (const tab of tabs) {
    if (typeof tab.id !== 'number' || tab.id < 0) continue;
    if (typeof tab.windowId !== 'number') continue;
    if (tab.pinned === true) continue;
    if (typeof tab.groupId === 'number' && tab.groupId >= 0) continue;
    const host = getHostname(tab.url ?? tab.pendingUrl ?? '');
    if (host === null) continue;
    let domainMap = buckets.get(tab.windowId);
    if (!domainMap) {
      domainMap = new Map();
      buckets.set(tab.windowId, domainMap);
    }
    let arr = domainMap.get(host);
    if (!arr) {
      arr = [];
      domainMap.set(host, arr);
    }
    arr.push(tab.id);
  }
  return buckets;
}

export type GroupingPlan = {
  windowId: number;
  domain: string;
  tabIds: number[];
};

export function planGroupings(buckets: WindowDomainBuckets, minSize = 2): GroupingPlan[] {
  const plans: GroupingPlan[] = [];
  for (const [windowId, domainMap] of buckets.entries()) {
    const entries = [...domainMap.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    for (const [domain, tabIds] of entries) {
      if (tabIds.length < minSize) continue;
      plans.push({ windowId, domain, tabIds });
    }
  }
  return plans;
}

async function applyGroupLabel(groupId: number, domain: string): Promise<void> {
  const api = getTabGroupsApi();
  if (api === null) return;
  try {
    await api.update(groupId, { title: domain, color: pickColorForDomain(domain) });
  } catch (err) {
    logger.error('tabGroups.update failed', err);
  }
}

export async function groupTabsByDomain(): Promise<GroupingOutcome> {
  if (!isTabsGroupAvailable()) {
    return { ok: false, reason: 'unavailable' };
  }
  const tabs = await queryAllTabs();
  const buckets = bucketTabsByWindowAndHostname(tabs);
  const plans = planGroupings(buckets);
  let groupsCreated = 0;
  let tabsGrouped = 0;
  for (const plan of plans) {
    try {
      const groupId = await chrome.tabs.group({
        tabIds: plan.tabIds,
        createProperties: { windowId: plan.windowId },
      });
      groupsCreated += 1;
      tabsGrouped += plan.tabIds.length;
      await applyGroupLabel(groupId, plan.domain);
    } catch (err) {
      logger.error('tabs.group failed', err, { domain: plan.domain });
    }
  }
  if (groupsCreated === 0) {
    return { ok: false, reason: 'no_candidates' };
  }
  return { ok: true, result: { groupsCreated, tabsGrouped } };
}
