import { defineConfig } from 'wxt'

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'SpaceTab',
    description: '基于项目空间的 Chrome 标签管理',
    version: '0.1.0',
    permissions: ['tabs', 'storage'],
  },
})
