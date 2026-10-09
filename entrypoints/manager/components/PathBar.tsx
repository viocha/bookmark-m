import { House } from 'lucide-react';
import { useLayoutEffect, useMemo, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';

type PathBarProps = {
  visible: boolean;
  isHomeView: boolean;
  breadcrumbs: chrome.bookmarks.BookmarkTreeNode[];
  onGoHome: () => void;
  onGoToFolder: (id: string) => void;
  getTitle: (node: chrome.bookmarks.BookmarkTreeNode) => string;
};

export function PathBar({ visible, isHomeView, breadcrumbs, onGoHome, onGoToFolder, getTitle }: PathBarProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollEndRef = useRef<HTMLLIElement | null>(null);
  const breadcrumbKey = useMemo(() => breadcrumbs.map((node) => node.id).join('/'), [breadcrumbs]);

  useLayoutEffect(() => {
    if (!visible) return;

    const container = scrollContainerRef.current;
    const end = scrollEndRef.current;
    if (!container || !end) return;

    end.scrollIntoView({
      block: 'nearest',
      inline: 'end',
    });
  }, [breadcrumbKey, visible]);

  if (!visible) return null;

  return (
    <div className="flex h-9 shrink-0 items-center border-b border-border/60 bg-background/82 px-3 backdrop-blur">
      <Breadcrumb
        ref={scrollContainerRef}
        aria-label="书签路径"
        className="w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <BreadcrumbList className="flex-nowrap gap-1.5">
          <BreadcrumbItem className="shrink-0">
            {isHomeView ? (
              <BreadcrumbPage aria-label="首页" className="inline-flex h-6 cursor-default items-center rounded-full bg-secondary px-2 text-xs font-semibold">
                <House className="size-3.5" />
              </BreadcrumbPage>
            ) : (
              <BreadcrumbLink render={<Button variant="secondary" size="xs" aria-label="首页" onClick={onGoHome} className="h-6 touch-manipulation rounded-full hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_2%)]" />}>
                <House className="size-3.5" />
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
          {breadcrumbs.map((node, index) => (
              <BreadcrumbItem key={node.id} className="shrink-0" ref={index === breadcrumbs.length - 1 ? scrollEndRef : undefined}>
                {index === breadcrumbs.length - 1 ? (
                  <BreadcrumbPage className="inline-flex h-6 cursor-default items-center rounded-full bg-secondary px-2.5 text-xs font-semibold">
                    {getTitle(node)}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Button variant="secondary" size="xs" onClick={() => onGoToFolder(node.id)} className="h-6 touch-manipulation rounded-full hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_2%)]" />}>
                    {getTitle(node)}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
