export const LAST_FOLDER_KEY = 'bookmark-m-last-folder';
export const RECENT_FOLDER_KEY = 'bookmark-m-recent-folders';
export const LAUNCH_CONTEXT_KEY = 'bookmark-m-launch-context';
export const SCROLL_POSITIONS_KEY = 'bookmark-m-scroll-positions';
export const DISPLAY_MODE_KEY = 'bookmark-m-display-mode';
export const TREE_EXPANDED_KEY = 'bookmark-m-tree-expanded';
export const INSERT_SETTINGS_KEY = 'bookmark-m-insert-settings';
export const VIEW_SETTINGS_KEY = 'bookmark-m-view-settings';

export interface LaunchContext {
  tabId?: number;
  title: string;
  url: string;
  ts: number;
}

export interface RecentFolder {
  id: string;
  title: string;
  path: string;
}

export interface FolderOption {
  id: string;
  title: string;
  path: string;
  depth: number;
  childCount: number;
}

export interface FolderTreeNode {
  id: string;
  title: string;
  path: string;
  depth: number;
  childCount: number;
  children: FolderTreeNode[];
}

export interface DeletedBookmarkSnapshot {
  node: chrome.bookmarks.BookmarkTreeNode;
}

export type BookmarkDisplayMode = 'list' | 'tree';
export type InsertPosition = 'top' | 'bottom';

export interface InsertSettings {
  folderPosition: InsertPosition;
  bookmarkPosition: InsertPosition;
}

export interface ViewSettings {
  listCompact: boolean;
  treeCompact: boolean;
  listBackNavigation: boolean;
}

type BookmarkSearchInput = string | { query?: string; title?: string; url?: string };
type BookmarkCreateInput = { parentId?: string; index?: number; title?: string; url?: string };
type BookmarkUpdateInput = { title?: string; url?: string };
type BookmarkMoveInput = { parentId?: string; index?: number };

function withLastError<T>(resolve: (value: T) => void, reject: (reason?: unknown) => void, value: T) {
  const error = chrome.runtime.lastError;
  if (error) {
    reject(new Error(error.message));
    return;
  }
  resolve(value);
}

function getStorageArea(area: 'local' | 'session') {
  if (area === 'session' && !chrome.storage.session) {
    return chrome.storage.local;
  }
  return chrome.storage[area];
}

function storageGet<T extends Record<string, unknown>>(area: 'local' | 'session', keys?: string | string[] | object | null) {
  return new Promise<T>((resolve, reject) => {
    getStorageArea(area).get(keys ?? null, (items) => withLastError(resolve, reject, items as T));
  });
}

function storageSet(area: 'local' | 'session', items: Record<string, unknown>) {
  return new Promise<void>((resolve, reject) => {
    getStorageArea(area).set(items, () => withLastError(resolve, reject, undefined));
  });
}

function storageRemove(area: 'local' | 'session', keys: string | string[]) {
  return new Promise<void>((resolve, reject) => {
    getStorageArea(area).remove(keys, () => withLastError(resolve, reject, undefined));
  });
}

function bookmarksGetTree() {
  return new Promise<chrome.bookmarks.BookmarkTreeNode[]>((resolve, reject) => {
    chrome.bookmarks.getTree((tree) => withLastError(resolve, reject, tree));
  });
}

function bookmarksGet(id: string) {
  return new Promise<chrome.bookmarks.BookmarkTreeNode[]>((resolve, reject) => {
    chrome.bookmarks.get(id, (nodes) => withLastError(resolve, reject, nodes));
  });
}

function bookmarksGetChildren(id: string) {
  return new Promise<chrome.bookmarks.BookmarkTreeNode[]>((resolve, reject) => {
    chrome.bookmarks.getChildren(id, (nodes) => withLastError(resolve, reject, nodes));
  });
}

function bookmarksGetSubTree(id: string) {
  return new Promise<chrome.bookmarks.BookmarkTreeNode[]>((resolve, reject) => {
    chrome.bookmarks.getSubTree(id, (nodes) => withLastError(resolve, reject, nodes));
  });
}

function bookmarksSearch(query: BookmarkSearchInput) {
  return new Promise<chrome.bookmarks.BookmarkTreeNode[]>((resolve, reject) => {
    chrome.bookmarks.search(query as string, (nodes) => withLastError(resolve, reject, nodes));
  });
}

function bookmarksCreate(bookmark: BookmarkCreateInput) {
  return new Promise<chrome.bookmarks.BookmarkTreeNode>((resolve, reject) => {
    chrome.bookmarks.create(bookmark, (node) => withLastError(resolve, reject, node));
  });
}

function bookmarksUpdate(id: string, changes: BookmarkUpdateInput) {
  return new Promise<chrome.bookmarks.BookmarkTreeNode>((resolve, reject) => {
    chrome.bookmarks.update(id, changes, (node) => withLastError(resolve, reject, node));
  });
}

function bookmarksRemove(id: string) {
  return new Promise<void>((resolve, reject) => {
    chrome.bookmarks.remove(id, () => withLastError(resolve, reject, undefined));
  });
}

function bookmarksRemoveTree(id: string) {
  return new Promise<void>((resolve, reject) => {
    chrome.bookmarks.removeTree(id, () => withLastError(resolve, reject, undefined));
  });
}

function bookmarksMove(id: string, destination: BookmarkMoveInput) {
  return new Promise<chrome.bookmarks.BookmarkTreeNode>((resolve, reject) => {
    chrome.bookmarks.move(id, destination, (node) => withLastError(resolve, reject, node));
  });
}

export function isFolder(node: chrome.bookmarks.BookmarkTreeNode): boolean {
  return !node.url;
}

export function isProtectedNode(id: string): boolean {
  return id === '0' || id === '1' || id === '2' || id === '3';
}

export function getDisplayTitle(node: Pick<chrome.bookmarks.BookmarkTreeNode, 'id' | 'title'>): string {
  if (node.title?.trim()) return node.title;
  if (node.id === '1') return '书签栏';
  if (node.id === '2') return '其他书签';
  if (node.id === '3') return '移动设备书签';
  return '未命名';
}

export function getManagerUrl() {
  return chrome.runtime.getURL('/manager.html');
}

export function sortFoldersFirst(nodes: chrome.bookmarks.BookmarkTreeNode[]) {
  const folders = nodes.filter((node) => isFolder(node));
  const bookmarks = nodes.filter((node) => !isFolder(node));
  return [...folders, ...bookmarks];
}

export async function getTreeRoots() {
  const tree = await bookmarksGetTree();
  return tree[0]?.children ?? [];
}

export async function getNode(id: string) {
  try {
    const [node] = await bookmarksGet(id);
    return node ?? null;
  } catch {
    return null;
  }
}

export async function getFolderPath(id: string) {
  const segments: string[] = [];
  let currentId: string | undefined = id;

  while (currentId && currentId !== '0') {
    const node = await getNode(currentId);
    if (!node) break;
    if (!node.url) segments.unshift(getDisplayTitle(node));
    currentId = node.parentId;
  }

  return segments.join(' / ');
}

export async function getFolderPathNodes(id: string) {
  const chain: chrome.bookmarks.BookmarkTreeNode[] = [];
  let currentId: string | undefined = id;

  while (currentId && currentId !== '0') {
    const node = await getNode(currentId);
    if (!node) break;
    if (!node.url) chain.unshift(node);
    currentId = node.parentId;
  }

  return chain;
}

export async function getFolderChildren(folderId: string) {
  const children = await bookmarksGetChildren(folderId);
  return sortFoldersFirst(children);
}

export async function ensureFolderId(id: string | null | undefined) {
  if (!id) return '1';
  const node = await getNode(id);
  if (!node || node.url) return '1';
  return node.id;
}

export async function getInitialFolderId() {
  const stored = await storageGet<Record<string, unknown>>('local', LAST_FOLDER_KEY);
  return ensureFolderId((stored[LAST_FOLDER_KEY] as string | undefined) ?? undefined);
}

export async function setLastFolderId(id: string) {
  await storageSet('local', { [LAST_FOLDER_KEY]: id });
}

export async function getSavedScrollPositions(): Promise<Record<string, number>> {
  const stored = await storageGet<Record<string, unknown>>('local', SCROLL_POSITIONS_KEY);
  const raw = stored[SCROLL_POSITIONS_KEY];

  if (!raw || typeof raw !== 'object') {
    return {};
  }

  const positions: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      positions[key] = value;
    }
  }

  return positions;
}

export async function setSavedScrollPositions(positions: Record<string, number>): Promise<void> {
  await storageSet('local', { [SCROLL_POSITIONS_KEY]: positions });
}

export async function getDisplayMode(): Promise<BookmarkDisplayMode> {
  const stored = await storageGet<Record<string, unknown>>('local', DISPLAY_MODE_KEY);
  return stored[DISPLAY_MODE_KEY] === 'tree' ? 'tree' : 'list';
}

export async function setDisplayMode(mode: BookmarkDisplayMode): Promise<void> {
  await storageSet('local', { [DISPLAY_MODE_KEY]: mode });
}

export async function getTreeExpandedIds(): Promise<string[]> {
  const stored = await storageGet<Record<string, unknown>>('local', TREE_EXPANDED_KEY);
  const raw = stored[TREE_EXPANDED_KEY];
  if (!Array.isArray(raw)) return [];
  return raw.filter((value): value is string => typeof value === 'string');
}

export async function setTreeExpandedIds(ids: string[]): Promise<void> {
  await storageSet('local', { [TREE_EXPANDED_KEY]: ids });
}

export async function getInsertSettings(): Promise<InsertSettings> {
  const stored = await storageGet<Record<string, unknown>>('local', INSERT_SETTINGS_KEY);
  const raw = stored[INSERT_SETTINGS_KEY] as Partial<InsertSettings> | undefined;
  return {
    folderPosition: raw?.folderPosition === 'top' ? 'top' : 'bottom',
    bookmarkPosition: raw?.bookmarkPosition === 'top' ? 'top' : 'bottom',
  };
}

export async function setInsertSettings(settings: InsertSettings): Promise<void> {
  await storageSet('local', { [INSERT_SETTINGS_KEY]: settings });
}

export async function getViewSettings(): Promise<ViewSettings> {
  const stored = await storageGet<Record<string, unknown>>('local', VIEW_SETTINGS_KEY);
  const raw = stored[VIEW_SETTINGS_KEY] as Partial<ViewSettings> | undefined;
  return {
    listCompact: raw?.listCompact === true,
    treeCompact: raw?.treeCompact !== false,
    listBackNavigation: raw?.listBackNavigation === true,
  };
}

export async function setViewSettings(settings: ViewSettings): Promise<void> {
  await storageSet('local', { [VIEW_SETTINGS_KEY]: settings });
}

export async function rememberFolder(folderId: string) {
  const node = await getNode(folderId);
  if (!node || node.url) return;

  const path = await getFolderPath(folderId);
  const existing = await storageGet<Record<string, unknown>>('local', RECENT_FOLDER_KEY);
  const list = (existing[RECENT_FOLDER_KEY] as RecentFolder[] | undefined) ?? [];
  const next = [{ id: folderId, title: getDisplayTitle(node), path }, ...list.filter((item) => item.id !== folderId)].slice(0, 50);
  await storageSet('local', { [RECENT_FOLDER_KEY]: next });
  await setLastFolderId(folderId);
}

export async function getRecentFolders() {
  try {
    const recentItems = await chrome.bookmarks.getRecent(100);
    const tree = await bookmarksGetTree();
    const allFolders: chrome.bookmarks.BookmarkTreeNode[] = [];

    const visit = (nodes: chrome.bookmarks.BookmarkTreeNode[]) => {
      for (const node of nodes) {
        if (!node.url && node.id !== '0') {
          allFolders.push(node);
        }
        if (node.children) {
          visit(node.children);
        }
      }
    };

    visit(tree);

    const recentCreatedFolders = [...allFolders]
      .sort((left, right) => (right.dateAdded ?? 0) - (left.dateAdded ?? 0))
      .slice(0, 50);

    const candidates: Array<{ id: string; score: number }> = [];

    recentItems.forEach((item) => {
      if (item.parentId) {
        candidates.push({ id: item.parentId, score: item.dateAdded ?? 0 });
      }
    });

    recentCreatedFolders.forEach((folder) => {
      candidates.push({ id: folder.id, score: folder.dateAdded ?? 0 });
    });

    candidates.sort((left, right) => right.score - left.score);

    const valid: RecentFolder[] = [];
    const seen = new Set<string>();

    for (const { id } of candidates) {
      if (valid.length >= 50 || seen.has(id)) continue;
      seen.add(id);

      const node = await getNode(id);
      if (!node || node.url) continue;

      valid.push({
        id: node.id,
        title: getDisplayTitle(node),
        path: await getFolderPath(node.id),
      });
    }

    await storageSet('local', { [RECENT_FOLDER_KEY]: valid });
    return valid;
  } catch {
    return [];
  }
}

export async function getLastVisitedFolder() {
  const folderId = await getInitialFolderId();
  const node = await getNode(folderId);
  if (!node || node.url) return null;

  return {
    id: folderId,
    title: getDisplayTitle(node),
    path: await getFolderPath(folderId),
  } satisfies RecentFolder;
}

export async function collectFolderOptions() {
  const options: FolderOption[] = [];
  const tree = await bookmarksGetTree();
  const roots = tree[0]?.children ?? [];

  const visit = (node: chrome.bookmarks.BookmarkTreeNode, depth: number, parents: string[]) => {
    if (node.url) return;

    const title = getDisplayTitle(node);
    const pathSegments = [...parents, title];
    const children = node.children ?? [];

    options.push({
      id: node.id,
      title,
      path: pathSegments.join(' / '),
      depth,
      childCount: children.length,
    });

    for (const child of children) {
      if (!child.url) visit(child, depth + 1, pathSegments);
    }
  };

  for (const root of roots) {
    visit(root, 0, []);
  }

  return options;
}

export async function collectFolderTree() {
  const tree = await bookmarksGetTree();
  const roots = tree[0]?.children ?? [];

  const visit = (node: chrome.bookmarks.BookmarkTreeNode, depth: number, parents: string[]): FolderTreeNode | null => {
    if (node.url) return null;

    const title = getDisplayTitle(node);
    const pathSegments = [...parents, title];
    const folderChildren = (node.children ?? []).filter((child) => !child.url);
    const allChildren = node.children ?? [];

    return {
      id: node.id,
      title,
      path: pathSegments.join(' / '),
      depth,
      childCount: allChildren.length,
      children: folderChildren
        .map((child) => visit(child, depth + 1, pathSegments))
        .filter((child): child is FolderTreeNode => Boolean(child)),
    };
  };

  return roots
    .map((root) => visit(root, 0, []))
    .filter((root): root is FolderTreeNode => Boolean(root));
}

export async function searchNodes(query: string) {
  const results = await bookmarksSearch(query);
  return results.filter((node) => node.id !== '0');
}

async function getFolderInsertIndex(parentId: string, position: 'top' | 'bottom' = 'bottom') {
  await normalizeFolderChildren(parentId);
  const children = await bookmarksGetChildren(parentId);
  const folders = children.filter((node) => !node.url);
  return position === 'top' ? 0 : folders.length;
}

async function getBookmarkInsertIndex(parentId: string, position: 'top' | 'bottom' = 'bottom') {
  await normalizeFolderChildren(parentId);
  const children = await bookmarksGetChildren(parentId);
  const folders = children.filter((node) => !node.url);
  if (position === 'top') return folders.length;
  return undefined;
}

export async function normalizeFolderChildren(parentId: string): Promise<boolean> {
  if (parentId === '0') return false;
  const children = await bookmarksGetChildren(parentId);
  const folders = children.filter((node) => !node.url);
  const bookmarks = children.filter((node) => !!node.url);
  const sorted = [...folders, ...bookmarks];
  let current = [...children];
  let changed = false;

  for (let index = 0; index < sorted.length; index += 1) {
    if (sorted[index].id !== current[index]?.id) {
      await bookmarksMove(sorted[index].id, { parentId, index });
      current = await bookmarksGetChildren(parentId);
      changed = true;
    }
  }

  return changed;
}

export async function normalizeAllFolders(): Promise<number> {
  const tree = await bookmarksGetTree();
  const roots = tree[0]?.children ?? [];
  let changedCount = 0;

  const visit = async (node: chrome.bookmarks.BookmarkTreeNode): Promise<void> => {
    if (node.url) return;

    if (await normalizeFolderChildren(node.id)) {
      changedCount += 1;
    }

    const refreshedChildren = await bookmarksGetChildren(node.id);
    for (const child of refreshedChildren.filter((item) => !item.url)) {
      await visit(child);
    }
  };

  for (const root of roots) {
    await visit(root);
  }

  return changedCount;
}

export async function createFolder(parentId: string, title: string, position: InsertPosition = 'bottom') {
  const index = await getFolderInsertIndex(parentId, position);
  const folder = await bookmarksCreate({ parentId, title: title.trim(), index });
  await rememberFolder(folder.parentId ?? parentId);
  return folder;
}

export async function createBookmark(parentId: string, title: string, url: string, position: InsertPosition = 'bottom') {
  const normalizedUrl = normalizeUrl(url);
  const index = await getBookmarkInsertIndex(parentId, position);
  const bookmark = await bookmarksCreate({
    parentId,
    title: title.trim(),
    url: normalizedUrl,
    index,
  });
  await rememberFolder(bookmark.parentId ?? parentId);
  return bookmark;
}

export async function updateBookmarkNode(id: string, changes: { title?: string; url?: string }) {
  const payload = {
    ...changes,
    url: typeof changes.url === 'string' ? normalizeUrl(changes.url) : undefined,
  };
  return bookmarksUpdate(id, payload);
}

export async function deleteNodes(ids: string[]) {
  for (const id of ids) {
    const node = await getNode(id);
    if (!node || isProtectedNode(id)) continue;
    if (node.url) {
      await bookmarksRemove(id);
    } else {
      await bookmarksRemoveTree(id);
    }
  }
}

export async function captureDeletedNodes(ids: string[]) {
  const snapshots = await Promise.all(
    ids.map(async (id) => {
      const [node] = await bookmarksGetSubTree(id);
      return node ? ({ node } satisfies DeletedBookmarkSnapshot) : null;
    }),
  );

  return snapshots.filter((snapshot): snapshot is DeletedBookmarkSnapshot => Boolean(snapshot));
}

async function restoreSnapshotNode(
  node: chrome.bookmarks.BookmarkTreeNode,
  parentId = node.parentId,
  index = node.index,
): Promise<chrome.bookmarks.BookmarkTreeNode | null> {
  if (!parentId) return null;

  const restored = await bookmarksCreate({
    parentId,
    index,
    title: node.title,
    url: node.url,
  });

  if (node.url) {
    return restored;
  }

  const children = [...(node.children ?? [])].sort((left, right) => (left.index ?? 0) - (right.index ?? 0));
  for (const child of children) {
    await restoreSnapshotNode(child, restored.id, child.index);
  }

  return restored;
}

export async function restoreDeletedNodes(snapshots: DeletedBookmarkSnapshot[]) {
  for (const snapshot of snapshots) {
    await restoreSnapshotNode(snapshot.node);
  }
}

export async function moveNodes(ids: string[], targetFolderId: string, settings?: Partial<InsertSettings>) {
  const nodes = (
    await Promise.all(ids.map(async (id) => getNode(id)))
  ).filter((node): node is chrome.bookmarks.BookmarkTreeNode => Boolean(node && !isProtectedNode(node.id)));

  const folders = nodes.filter((node) => !node.url);
  const bookmarks = nodes.filter((node) => !!node.url);
  const folderPosition = settings?.folderPosition === 'top' ? 'top' : 'bottom';
  const bookmarkPosition = settings?.bookmarkPosition === 'top' ? 'top' : 'bottom';

  let folderIndex = await getFolderInsertIndex(targetFolderId, folderPosition);

  for (const node of folders) {
    await bookmarksMove(node.id, { parentId: targetFolderId, index: folderIndex });
    folderIndex += 1;
  }

  await normalizeFolderChildren(targetFolderId);
  for (const node of bookmarks) {
    const index = await getBookmarkInsertIndex(targetFolderId, bookmarkPosition);
    await bookmarksMove(node.id, { parentId: targetFolderId, index });
  }

  await normalizeFolderChildren(targetFolderId);
  await rememberFolder(targetFolderId);
}

export async function reorderNodeWithinFolder(nodeId: string, parentId: string, visibleInsertIndex: number) {
  if (!parentId || parentId === '0') return;

  await normalizeFolderChildren(parentId);
  const children = sortFoldersFirst(await bookmarksGetChildren(parentId));
  const draggedNode = children.find((node) => node.id === nodeId);
  if (!draggedNode) return;

  const visibleWithoutDragged = children.filter((node) => node.id !== nodeId);
  const clampedInsertIndex = Math.max(0, Math.min(visibleInsertIndex, visibleWithoutDragged.length));
  const nodesBeforeInsert = visibleWithoutDragged.slice(0, clampedInsertIndex);

  let targetIndex = 0;
  if (isFolder(draggedNode)) {
    targetIndex = nodesBeforeInsert.filter((node) => isFolder(node)).length;
  } else {
    const folderCount = visibleWithoutDragged.filter((node) => isFolder(node)).length;
    const bookmarkCountBeforeInsert = nodesBeforeInsert.filter((node) => !isFolder(node)).length;
    targetIndex = folderCount + bookmarkCountBeforeInsert;
  }

  // Chrome bookmarks.move uses same-parent indexes with the source node still counted.
  // When moving downward within the same folder, adjust by one to land on the intended slot.
  if (draggedNode.parentId === parentId && typeof draggedNode.index === 'number' && targetIndex > draggedNode.index) {
    targetIndex += 1;
  }

  if (draggedNode.index === targetIndex && draggedNode.parentId === parentId) return;

  await bookmarksMove(nodeId, { parentId, index: targetIndex });
  await normalizeFolderChildren(parentId);
  await rememberFolder(parentId);
}

export async function getNodeUrls(id: string): Promise<string[]> {
  const [subtree] = await bookmarksGetSubTree(id);
  if (!subtree) return [];

  const urls: string[] = [];
  const visit = (node: chrome.bookmarks.BookmarkTreeNode) => {
    if (node.url) {
      urls.push(node.url);
      return;
    }
    for (const child of node.children ?? []) {
      visit(child);
    }
  };

  visit(subtree);
  return urls;
}

export async function getLaunchContext() {
  const stored = await storageGet<Record<string, unknown>>('session', LAUNCH_CONTEXT_KEY);
  return (stored[LAUNCH_CONTEXT_KEY] as LaunchContext | undefined) ?? null;
}

export async function setLaunchContext(context: LaunchContext | null) {
  if (!context) {
    await storageRemove('session', LAUNCH_CONTEXT_KEY);
    return;
  }
  await storageSet('session', { [LAUNCH_CONTEXT_KEY]: context });
}

export function normalizeUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
