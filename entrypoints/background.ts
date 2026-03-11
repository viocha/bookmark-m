import {
  getLaunchContext,
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

async function syncLaunchContext(sourceTab?: chrome.tabs.Tab) {
  if (!sourceTab?.url || !sourceTab.title) return null;

  const context: LaunchContext = {
    tabId: sourceTab.id,
    title: sourceTab.title,
    url: sourceTab.url,
    ts: Date.now(),
  };

  await setLaunchContext(context);
  await chrome.runtime.sendMessage({ type: 'launch-context-updated', payload: context }).catch(() => undefined);
  return context;
}

export default defineBackground(() => {
  chrome.action.onClicked.addListener(async (tab) => {
    await syncLaunchContext(tab);

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
