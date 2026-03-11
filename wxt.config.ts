import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons'],
  autoIcons: {
    baseIconPath: './assets/icon.svg',
  },
  manifest: {
    name: 'Bookmark M',
    description: '面向移动端触控体验的书签管理扩展，支持快速浏览、搜索、整理与编辑书签。',
    permissions: ['bookmarks', 'tabs', 'storage', 'favicon'],
    action: {
      default_title: 'Open Bookmark M',
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': __dirname,
      },
    },
  }),
});
