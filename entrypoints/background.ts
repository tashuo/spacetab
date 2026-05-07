export default defineBackground(() => {
  chrome.action.onClicked.addListener(async () => {
    const managerUrl = chrome.runtime.getURL('manager.html')
    const existing = await chrome.tabs.query({ url: managerUrl })
    const first = existing[0]
    if (first && typeof first.id === 'number') {
      await chrome.tabs.update(first.id, { active: true })
      if (typeof first.windowId === 'number') {
        await chrome.windows.update(first.windowId, { focused: true })
      }
      return
    }
    await chrome.tabs.create({ url: managerUrl, active: true, pinned: true })
  })
})
