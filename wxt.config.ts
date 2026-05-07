import { defineConfig } from 'wxt'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'SpaceTab',
    description: 'Chrome tab manager built around project spaces',
    version: '0.1.0',
    permissions: ['tabs', 'storage'],
    action: {
      default_title: 'SpaceTab',
    },
  },
})
