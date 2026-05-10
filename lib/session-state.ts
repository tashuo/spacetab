export interface SessionState {
  vaultWindowId: number | null
  spaceIdToTabIds: Record<string, number[]>
  /** 当前可见窗口对应的空间 id;切换时更新,用于撤销切换。
   *  可选以兼容旧测试夹具,读取时统一用 `?? null`。 */
  currentSpaceId?: string | null
}

const KEYS = ['vaultWindowId', 'spaceIdToTabIds', 'currentSpaceId'] as const

export const EMPTY_SESSION: SessionState = {
  vaultWindowId: null,
  spaceIdToTabIds: {},
  currentSpaceId: null,
}

export async function readSessionState(): Promise<SessionState> {
  try {
    const stored = await chrome.storage.session.get(KEYS as unknown as string[])
    const win = stored.vaultWindowId
    const map = stored.spaceIdToTabIds
    const cur = stored.currentSpaceId
    return {
      vaultWindowId: typeof win === 'number' ? win : null,
      spaceIdToTabIds:
        map && typeof map === 'object' && !Array.isArray(map)
          ? (map as Record<string, number[]>)
          : {},
      currentSpaceId: typeof cur === 'string' && cur.length > 0 ? cur : null,
    }
  } catch {
    return EMPTY_SESSION
  }
}

export async function writeSessionState(s: SessionState): Promise<void> {
  try {
    await chrome.storage.session.set({
      vaultWindowId: s.vaultWindowId,
      spaceIdToTabIds: s.spaceIdToTabIds,
      currentSpaceId: s.currentSpaceId ?? null,
    })
  } catch {
    // 写失败不阻塞主流程,下一次读会回退到 EMPTY_SESSION
  }
}

export function untagTabIdInState(state: SessionState, tabId: number): SessionState {
  let changed = false
  const next: Record<string, number[]> = {}
  for (const [sid, ids] of Object.entries(state.spaceIdToTabIds)) {
    const filtered = ids.filter((id) => id !== tabId)
    if (filtered.length !== ids.length) changed = true
    if (filtered.length > 0) next[sid] = filtered
  }
  if (!changed) return state
  return { ...state, spaceIdToTabIds: next }
}

export function tagTabIdsForSpace(
  state: SessionState,
  spaceId: string,
  ids: number[],
): SessionState {
  if (ids.length === 0) return state
  const existing = state.spaceIdToTabIds[spaceId] ?? []
  const idSet = new Set(ids)
  const merged = [...existing.filter((id) => !idSet.has(id)), ...ids]
  return {
    ...state,
    spaceIdToTabIds: { ...state.spaceIdToTabIds, [spaceId]: merged },
  }
}

export function dropSpaceFromState(state: SessionState, spaceId: string): SessionState {
  if (!(spaceId in state.spaceIdToTabIds)) return state
  const next = { ...state.spaceIdToTabIds }
  delete next[spaceId]
  return { ...state, spaceIdToTabIds: next }
}
