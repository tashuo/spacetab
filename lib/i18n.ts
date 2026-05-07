import { useEffect, useState } from 'react'

export type Lang = 'zh-CN' | 'en' | 'ja' | 'de'
export const LANGS: Lang[] = ['zh-CN', 'en', 'ja', 'de']
export const LANG_LABELS: Record<Lang, string> = {
  'zh-CN': '中文',
  en: 'English',
  ja: '日本語',
  de: 'Deutsch',
}
const DEFAULT_LANG: Lang = 'en'
const STORAGE_KEY = 'lang'

const messages: Record<Lang, Record<string, string>> = {
  'zh-CN': {
    appName: 'SpaceTab',
    spacesCount: '{n} 个空间',
    mySpaces: '我的空间',
    currentWindow: '当前窗口',
    headerSubtitle: '点扩展图标随时回到这里。归档/切换只影响当前窗口的非固定标签。',
    archiveCurrentWindow: '归档当前窗口',
    archiveTo: '归档到…',
    newSpace: '新建空间',
    newSpaceName: '新空间名',
    create: '创建',
    switchAction: '切换',
    switchToSpaceTitle: '切换到此空间',
    rename: '重命名',
    delete: '删除',
    moveToOtherSpace: '移到其他空间',
    moveTo: '移到…',
    removeFromSpace: '从空间删除',
    moveToSpaceLive: '移到空间',
    closeTab: '关闭标签',
    tabsLabel: 'tabs',
    loading: '加载中…',
    emptyTitle: '还没创建空间',
    emptySubtitle: '点右上角「归档当前窗口」收集第一组标签',
    emptyLiveTabs: '没有其他标签',
    confirmDelete: '删除空间「{name}」?其中 {n} 个标签会一起丢失。',
    toastArchived: '已归档 {n} 个标签到「{name}」',
    toastArchivedNew: '已创建「{name}」并归档 {n} 个标签',
    toastSwitched: '已切换到「{name}」',
    toastFailedTabs: '{n} 个标签无法恢复',
    toastArchiveFailed: '归档失败,请重试',
    toastSwitchFailed: '切换失败,请重试',
    toastCannotMove: '无法移动该标签',
    toastAddedTo: '已加入「{name}」',
    toastMoveFailed: '移动失败,请重试',
    toastSpaceMissing: '空间已不存在',
    toastWindowEmpty: '当前窗口没有可归档的标签',
    toastStorageReadFailed: '存储读取失败',
    toastStorageWriteFailed: '存储写入失败,已回滚',
    toastDataCorrupted: '数据损坏,已备份至 {backupKey}',
    timeJustNow: '刚刚',
    timeMinutesAgo: '{n} 分钟前',
    timeHoursAgo: '{n} 小时前',
    timeYesterday: '昨天',
    timeDaysAgo: '{n} 天前',
    timeWeeksAgo: '{n} 周前',
    timeMonthsAgo: '{n} 个月前',
    timeYearsAgo: '{n} 年前',
    languageSelect: '语言',
  },
  en: {
    appName: 'SpaceTab',
    spacesCount: '{n} spaces',
    mySpaces: 'My Spaces',
    currentWindow: 'Current Window',
    headerSubtitle:
      "Click the extension icon to return any time. Archive/switch only affects the current window's non-pinned tabs.",
    archiveCurrentWindow: 'Archive current window',
    archiveTo: 'Archive to…',
    newSpace: 'New space',
    newSpaceName: 'New space name',
    create: 'Create',
    switchAction: 'Switch',
    switchToSpaceTitle: 'Switch to this space',
    rename: 'Rename',
    delete: 'Delete',
    moveToOtherSpace: 'Move to another space',
    moveTo: 'Move to…',
    removeFromSpace: 'Remove from space',
    moveToSpaceLive: 'Add to a space',
    closeTab: 'Close tab',
    tabsLabel: 'tabs',
    loading: 'Loading…',
    emptyTitle: 'No spaces yet',
    emptySubtitle: 'Click "Archive current window" up top to collect your first group of tabs',
    emptyLiveTabs: 'No other tabs',
    confirmDelete: 'Delete "{name}"? Its {n} tabs will be lost.',
    toastArchived: 'Archived {n} tabs to "{name}"',
    toastArchivedNew: 'Created "{name}" and archived {n} tabs',
    toastSwitched: 'Switched to "{name}"',
    toastFailedTabs: '{n} tabs could not be restored',
    toastArchiveFailed: 'Archive failed, please retry',
    toastSwitchFailed: 'Switch failed, please retry',
    toastCannotMove: 'Cannot move this tab',
    toastAddedTo: 'Added to "{name}"',
    toastMoveFailed: 'Move failed, please retry',
    toastSpaceMissing: 'Space no longer exists',
    toastWindowEmpty: 'No archivable tabs in the current window',
    toastStorageReadFailed: 'Storage read failed',
    toastStorageWriteFailed: 'Storage write failed, rolled back',
    toastDataCorrupted: 'Data corrupted, backed up at {backupKey}',
    timeJustNow: 'just now',
    timeMinutesAgo: '{n}m ago',
    timeHoursAgo: '{n}h ago',
    timeYesterday: 'yesterday',
    timeDaysAgo: '{n}d ago',
    timeWeeksAgo: '{n}w ago',
    timeMonthsAgo: '{n}mo ago',
    timeYearsAgo: '{n}y ago',
    languageSelect: 'Language',
  },
  ja: {
    appName: 'SpaceTab',
    spacesCount: '{n} 個のスペース',
    mySpaces: 'マイスペース',
    currentWindow: '現在のウィンドウ',
    headerSubtitle:
      '拡張機能のアイコンをクリックするといつでも戻れます。保存/切り替えは現在のウィンドウのピン留めされていないタブにのみ影響します。',
    archiveCurrentWindow: '現在のウィンドウを保存',
    archiveTo: '保存先…',
    newSpace: '新しいスペース',
    newSpaceName: 'スペース名',
    create: '作成',
    switchAction: '切り替え',
    switchToSpaceTitle: 'このスペースに切り替える',
    rename: '名前を変更',
    delete: '削除',
    moveToOtherSpace: '別のスペースへ移動',
    moveTo: '移動先…',
    removeFromSpace: 'スペースから削除',
    moveToSpaceLive: 'スペースに追加',
    closeTab: 'タブを閉じる',
    tabsLabel: 'タブ',
    loading: '読み込み中…',
    emptyTitle: 'スペースがありません',
    emptySubtitle: '右上の「現在のウィンドウを保存」から最初のタブグループを作成しましょう',
    emptyLiveTabs: '他のタブはありません',
    confirmDelete: '「{name}」を削除しますか? {n} 個のタブが失われます。',
    toastArchived: '{n} 個のタブを「{name}」に保存しました',
    toastArchivedNew: '「{name}」を作成し、{n} 個のタブを保存しました',
    toastSwitched: '「{name}」に切り替えました',
    toastFailedTabs: '{n} 個のタブを復元できませんでした',
    toastArchiveFailed: '保存に失敗しました。もう一度お試しください',
    toastSwitchFailed: '切り替えに失敗しました。もう一度お試しください',
    toastCannotMove: 'このタブは移動できません',
    toastAddedTo: '「{name}」に追加しました',
    toastMoveFailed: '移動に失敗しました。もう一度お試しください',
    toastSpaceMissing: 'スペースが見つかりません',
    toastWindowEmpty: '保存できるタブが現在のウィンドウにありません',
    toastStorageReadFailed: 'データの読み込みに失敗しました',
    toastStorageWriteFailed: 'データの書き込みに失敗しました。変更を元に戻しました',
    toastDataCorrupted: 'データが破損しています。{backupKey} にバックアップしました',
    timeJustNow: 'たった今',
    timeMinutesAgo: '{n}分前',
    timeHoursAgo: '{n}時間前',
    timeYesterday: '昨日',
    timeDaysAgo: '{n}日前',
    timeWeeksAgo: '{n}週間前',
    timeMonthsAgo: '{n}ヶ月前',
    timeYearsAgo: '{n}年前',
    languageSelect: '言語',
  },
  de: {
    appName: 'SpaceTab',
    spacesCount: '{n} Spaces',
    mySpaces: 'Meine Spaces',
    currentWindow: 'Aktuelles Fenster',
    headerSubtitle:
      'Klicke auf das Erweiterungssymbol, um jederzeit zurückzukehren. Archivieren/Wechseln betrifft nur nicht angeheftete Tabs des aktuellen Fensters.',
    archiveCurrentWindow: 'Aktuelles Fenster archivieren',
    archiveTo: 'Archivieren in…',
    newSpace: 'Neuer Space',
    newSpaceName: 'Name des Spaces',
    create: 'Erstellen',
    switchAction: 'Wechseln',
    switchToSpaceTitle: 'Zu diesem Space wechseln',
    rename: 'Umbenennen',
    delete: 'Löschen',
    moveToOtherSpace: 'In anderen Space verschieben',
    moveTo: 'Verschieben nach…',
    removeFromSpace: 'Aus Space entfernen',
    moveToSpaceLive: 'Zu Space hinzufügen',
    closeTab: 'Tab schließen',
    tabsLabel: 'Tabs',
    loading: 'Wird geladen…',
    emptyTitle: 'Noch keine Spaces',
    emptySubtitle:
      'Klicke oben auf „Aktuelles Fenster archivieren", um deine erste Tab-Gruppe zu speichern',
    emptyLiveTabs: 'Keine weiteren Tabs',
    confirmDelete: '„{name}" löschen? Die enthaltenen {n} Tabs gehen verloren.',
    toastArchived: '{n} Tabs in „{name}" archiviert',
    toastArchivedNew: '„{name}" erstellt und {n} Tabs archiviert',
    toastSwitched: 'Zu „{name}" gewechselt',
    toastFailedTabs: '{n} Tabs konnten nicht wiederhergestellt werden',
    toastArchiveFailed: 'Archivieren fehlgeschlagen, bitte erneut versuchen',
    toastSwitchFailed: 'Wechsel fehlgeschlagen, bitte erneut versuchen',
    toastCannotMove: 'Tab kann nicht verschoben werden',
    toastAddedTo: 'Zu „{name}" hinzugefügt',
    toastMoveFailed: 'Verschieben fehlgeschlagen, bitte erneut versuchen',
    toastSpaceMissing: 'Space existiert nicht mehr',
    toastWindowEmpty: 'Keine archivierbaren Tabs im aktuellen Fenster',
    toastStorageReadFailed: 'Speicher konnte nicht gelesen werden',
    toastStorageWriteFailed: 'Speichern fehlgeschlagen, Änderungen rückgängig gemacht',
    toastDataCorrupted: 'Daten beschädigt, Sicherung unter {backupKey} erstellt',
    timeJustNow: 'gerade eben',
    timeMinutesAgo: 'vor {n} Min.',
    timeHoursAgo: 'vor {n} Std.',
    timeYesterday: 'gestern',
    timeDaysAgo: 'vor {n} Tagen',
    timeWeeksAgo: 'vor {n} Wochen',
    timeMonthsAgo: 'vor {n} Monaten',
    timeYearsAgo: 'vor {n} Jahren',
    languageSelect: 'Sprache',
  },
}

export function detectBrowserLang(): Lang {
  let raw = ''
  try {
    if (typeof chrome !== 'undefined' && chrome.i18n?.getUILanguage) {
      raw = chrome.i18n.getUILanguage()
    } else if (typeof navigator !== 'undefined') {
      raw = navigator.language
    }
  } catch {
    raw = ''
  }
  const lower = raw.toLowerCase()
  if (lower.startsWith('zh')) return 'zh-CN'
  if (lower.startsWith('ja')) return 'ja'
  if (lower.startsWith('de')) return 'de'
  return 'en'
}

export async function readLang(): Promise<Lang> {
  try {
    const stored = await chrome.storage.local.get(STORAGE_KEY)
    const v = stored[STORAGE_KEY]
    if (typeof v === 'string' && (LANGS as string[]).includes(v)) return v as Lang
  } catch {
    // 读取失败时降级到浏览器语言检测
  }
  return detectBrowserLang()
}

export async function writeLang(lang: Lang): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: lang })
  } catch {
    // 写入失败静默处理,不阻断用户操作
  }
}

export function format(
  lang: Lang,
  key: string,
  params?: Record<string, string | number>,
): string {
  const dict = messages[lang]
  const fallback = messages[DEFAULT_LANG]
  let s = dict[key] ?? fallback[key] ?? key
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
    }
  }
  return s
}

export function useT(): {
  t: (key: string, params?: Record<string, string | number>) => string
  lang: Lang
  setLang: (l: Lang) => void
} {
  // 同步初始化,避免首帧白屏
  const [lang, setLangState] = useState<Lang>(detectBrowserLang())

  useEffect(() => {
    let mounted = true
    void readLang().then((l) => {
      if (mounted) setLangState(l)
    })
    const onChange = (
      changes: { [k: string]: chrome.storage.StorageChange },
      area: string,
    ) => {
      if (area !== 'local') return
      const change = changes[STORAGE_KEY]
      if (change && typeof change.newValue === 'string') {
        if ((LANGS as string[]).includes(change.newValue)) {
          setLangState(change.newValue as Lang)
        }
      }
    }
    try {
      chrome.storage.onChanged.addListener(onChange)
    } catch {
      // 非扩展环境(dev server)下忽略
    }
    return () => {
      mounted = false
      try {
        chrome.storage.onChanged.removeListener(onChange)
      } catch {
        // 同上
      }
    }
  }, [])

  const t = (key: string, params?: Record<string, string | number>) =>
    format(lang, key, params)
  const setLang = (l: Lang) => {
    setLangState(l) // 乐观更新,让 UI 响应更快
    void writeLang(l)
  }
  return { t, lang, setLang }
}
