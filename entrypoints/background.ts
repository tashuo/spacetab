export default defineBackground(() => {
  // P0:无后台逻辑。所有写操作由 popup 在前台触发。
  // 这里仅保留入口,P1 接入快捷键命令时再加 chrome.commands 监听。
})
