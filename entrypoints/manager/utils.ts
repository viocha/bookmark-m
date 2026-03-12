import { getDisplayTitle, sortFoldersFirst, type FolderTreeNode } from '@/lib/bookmark-service';

export const HOME_FOLDER_ID = '__home__';
export const TREE_SCROLL_KEY = '__tree_view__';

export async function safeCall<T>(task: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await task();
  } catch {
    return fallback;
  }
}

export async function safeCallWithTimeout<T>(task: () => Promise<T>, fallback: T, timeoutMs = 4000): Promise<T> {
  try {
    return await Promise.race([
      task(),
      new Promise<T>((resolve) => {
        window.setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } catch {
    return fallback;
  }
}

export function flattenTreeNodes(nodes: chrome.bookmarks.BookmarkTreeNode[]): chrome.bookmarks.BookmarkTreeNode[] {
  const result: chrome.bookmarks.BookmarkTreeNode[] = [];

  const visit = (node: chrome.bookmarks.BookmarkTreeNode) => {
    result.push(node);
    if (!node.url) {
      for (const child of sortFoldersFirst(node.children ?? [])) {
        visit(child);
      }
    }
  };

  for (const node of nodes) {
    visit(node);
  }

  return result;
}

export function getFaviconUrl(url: string) {
  return `${chrome.runtime.getURL('/_favicon/')}?pageUrl=${encodeURIComponent(url)}&size=32`;
}

export function getBookmarkMeta(node: chrome.bookmarks.BookmarkTreeNode, folderChildCount?: number) {
  if (node.url) {
    return node.url;
  }

  const count = folderChildCount ?? node.children?.length ?? 0;
  return count === 0 ? '空文件夹' : `${count} 个项目`;
}

export function collectFolderChildCounts(nodes: chrome.bookmarks.BookmarkTreeNode[]) {
  const counts: Record<string, number> = {};

  const visit = (node: chrome.bookmarks.BookmarkTreeNode) => {
    if (node.url) return;
    const children = node.children ?? [];
    counts[node.id] = children.length;
    for (const child of children) {
      visit(child);
    }
  };

  for (const node of nodes) {
    visit(node);
  }

  return counts;
}

export function filterFolderTree(nodes: FolderTreeNode[], keyword: string): FolderTreeNode[] {
  if (!keyword) return nodes;
  const lowered = keyword.trim().toLowerCase();
  if (!lowered) return nodes;

  return nodes
    .map((node) => {
      const children = filterFolderTree(node.children, lowered);
      const matched = node.title.toLowerCase().includes(lowered) || node.path.toLowerCase().includes(lowered);
      if (!matched && children.length === 0) return null;
      return { ...node, children };
    })
    .filter((node): node is FolderTreeNode => Boolean(node));
}

export function findFolderPath(nodes: FolderTreeNode[], id: string): string {
  for (const node of nodes) {
    if (node.id === id) return node.path;
    const nested = findFolderPath(node.children, id);
    if (nested) return nested;
  }
  return '';
}

export function getNodeDisplayTitle(node: chrome.bookmarks.BookmarkTreeNode) {
  return getDisplayTitle(node);
}
