import { describe, it, expect } from 'vitest'

describe('smoke', () => {
  it('arithmetic still works', () => {
    expect(1 + 1).toBe(2)
  })

  it('chrome global is stubbed', () => {
    expect(chrome.storage.local).toBeDefined()
  })
})
