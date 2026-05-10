import { useEffect, useState } from 'react'

const KEY_NEWTAB = 'useAsNewtab'

/** 是否让 SpaceTab 接管新标签页(Cmd+T)。默认关闭。 */
export async function readUseAsNewtab(): Promise<boolean> {
  try {
    const r = await chrome.storage.local.get(KEY_NEWTAB)
    return r[KEY_NEWTAB] === true
  } catch {
    return false
  }
}

export async function writeUseAsNewtab(v: boolean): Promise<void> {
  try {
    await chrome.storage.local.set({ [KEY_NEWTAB]: v })
  } catch {
    // 忽略写入失败,UI 状态层会以读到的值为准
  }
}

export function useUseAsNewtab(): {
  enabled: boolean
  setEnabled: (v: boolean) => void
} {
  const [enabled, setState] = useState(false)
  useEffect(() => {
    let mounted = true
    void readUseAsNewtab().then((v) => {
      if (mounted) setState(v)
    })
    const onChange = (
      changes: { [k: string]: chrome.storage.StorageChange },
      area: string,
    ) => {
      if (area === 'local' && KEY_NEWTAB in changes) {
        setState(changes[KEY_NEWTAB]?.newValue === true)
      }
    }
    chrome.storage.onChanged.addListener(onChange)
    return () => {
      mounted = false
      chrome.storage.onChanged.removeListener(onChange)
    }
  }, [])
  const setEnabled = (v: boolean) => {
    setState(v)
    void writeUseAsNewtab(v)
  }
  return { enabled, setEnabled }
}
