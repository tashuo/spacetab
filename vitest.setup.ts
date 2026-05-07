import { fakeBrowser } from '@webext-core/fake-browser'
import { vi, beforeEach } from 'vitest'

vi.stubGlobal('chrome', fakeBrowser)

beforeEach(() => {
  fakeBrowser.reset()
})
