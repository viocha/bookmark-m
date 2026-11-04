import {
  getLaunchContext,
  getLatestLaunchContext,
  getManagerUrl,
  type LaunchContext,
  setLaunchContext,
} from '@/lib/bookmark-service';

async function focusTab(tab: chrome.tabs.Tab) {
  if (typeof tab.windowId === 'number') {
    await chrome.windows.update(tab.windowId, { focused: true });
  }
  if (typeof tab.id === 'number') {
    await chrome.tabs.update(tab.id, { active: true });
  }
}

async function syncLaunchContext(sourceTab?: chrome.tabs.Tab, onlyIfCurrent = false) {
  if (!sourceTab?.url) return null;
  const current = await getLaunchContext();
  if (onlyIfCurrent && current?.tabId !== sourceTab.id) return current;

  const context = await getLatestLaunchContext({
    tabId: sourceTab.id,
    title: sourceTab.title || sourceTab.url,
    url: sourceTab.url,
    ts: Date.now(),
  });
  if (current && current.tabId === context.tabId && current.title === context.title && current.url === context.url) return current;

  await setLaunchContext(context);
  await chrome.runtime.sendMessage({ type: 'launch-context-updated', payload: context }).catch(() => undefined);
  return context;
}

export default defineBackground(() => {
  // 串行同步来源页面，避免标题更新与切换来源标签页相互覆盖。
  let contextUpdates: Promise<LaunchContext | null> = Promise.resolve(null);
  const updateContext = (tab: chrome.tabs.Tab, onlyIfCurrent = false) => {
    const update = contextUpdates.then(() => syncLaunchContext(tab, onlyIfCurrent));
    contextUpdates = update.catch(() => null);
    return update;
  };

  chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
    if (changeInfo.title === undefined && changeInfo.url === undefined) return;
    return updateContext(tab, true);
  });

  chrome.action.onClicked.addListener(async (tab) => {
    await updateContext(tab);

    const managerUrl = getManagerUrl();
    const [existing] = await chrome.tabs.query({ url: managerUrl });

    if (existing) {
      await focusTab(existing);
      return;
    }

    await chrome.tabs.create({ url: managerUrl, active: true });
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'get-launch-context') {
      getLaunchContext().then((payload) => {
        sendResponse({ payload });
      });
      return true;
    }

    return undefined;
  });
});
