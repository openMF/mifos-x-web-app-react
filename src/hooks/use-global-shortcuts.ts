import { useEffect } from 'react'
import type { ParseKeys } from 'i18next'

export type GlobalShortcut = {
  id: string
  keys: string[]
  descriptionKey: ParseKeys<'common'>
  action: 'navigate' | 'toggle-sidebar' | 'save' | 'cancel' | 'help' | 'logout'
  path?: string
}

export const GLOBAL_SHORTCUTS: GlobalShortcut[] = [
  {
    id: 'toggle-sidebar',
    keys: ['Ctrl', 'B'],
    descriptionKey: 'shortcuts.descriptions.toggleSidebar',
    action: 'toggle-sidebar',
  },
  {
    id: 'navigation',
    keys: ['Ctrl', 'Alt', 'N'],
    descriptionKey: 'shortcuts.descriptions.navigation',
    action: 'navigate',
    path: '/navigation',
  },
  {
    id: 'run-report',
    keys: ['Ctrl', 'Alt', 'T'],
    descriptionKey: 'shortcuts.descriptions.runReport',
    action: 'navigate',
    path: '/reports',
  },
  {
    id: 'checker-inbox',
    keys: ['Ctrl', 'I'],
    descriptionKey: 'shortcuts.descriptions.checkerInbox',
    action: 'navigate',
    path: '/checker-inbox-and-tasks/checker-inbox',
  },
  {
    id: 'create-client',
    keys: ['Alt', 'C'],
    descriptionKey: 'shortcuts.descriptions.createClient',
    action: 'navigate',
    path: '/clients/create',
  },
  {
    id: 'create-group',
    keys: ['Ctrl', 'G'],
    descriptionKey: 'shortcuts.descriptions.createGroup',
    action: 'navigate',
    path: '/groups/create',
  },
  {
    id: 'create-center',
    keys: ['Ctrl', 'Q'],
    descriptionKey: 'shortcuts.descriptions.createCenter',
    action: 'navigate',
    path: '/centers/create',
  },
  {
    id: 'frequent-posting',
    keys: ['Ctrl', 'Alt', 'F'],
    descriptionKey: 'shortcuts.descriptions.frequentPosting',
    action: 'navigate',
    path: '/accounting/journal-entries/frequent-postings',
  },
  {
    id: 'closure-entries',
    keys: ['Ctrl', 'E'],
    descriptionKey: 'shortcuts.descriptions.closureEntries',
    action: 'navigate',
    path: '/accounting/closing-entries',
  },
  {
    id: 'journal-entry',
    keys: ['Ctrl', 'J'],
    descriptionKey: 'shortcuts.descriptions.journalEntry',
    action: 'navigate',
    path: '/accounting/journal-entries/create',
  },
  {
    id: 'reports',
    keys: ['Ctrl', 'Alt', 'R'],
    descriptionKey: 'shortcuts.descriptions.reports',
    action: 'navigate',
    path: '/reports',
  },
  {
    id: 'accounting',
    keys: ['Alt', 'A'],
    descriptionKey: 'shortcuts.descriptions.accounting',
    action: 'navigate',
    path: '/accounting',
  },
  {
    id: 'save-form',
    keys: ['Alt', 'S'],
    descriptionKey: 'shortcuts.descriptions.saveForm',
    action: 'save',
  },
  {
    id: 'cancel-form',
    keys: ['Alt', 'X'],
    descriptionKey: 'shortcuts.descriptions.cancelForm',
    action: 'cancel',
  },
  {
    id: 'help',
    keys: ['Alt', 'H'],
    descriptionKey: 'shortcuts.descriptions.help',
    action: 'help',
  },
  {
    id: 'logout',
    keys: ['Ctrl', 'Alt', 'L'],
    descriptionKey: 'shortcuts.descriptions.logout',
    action: 'logout',
  },
]

type ShortcutHandlers = {
  navigate: (path: string) => void
  toggleSidebar: () => void
  logout: () => void | Promise<void>
}

const isTypingTarget = (target: EventTarget | null) => {
  const element = target instanceof Element ? target : null

  return (
    element?.closest(
      'input, textarea, select, [contenteditable], [role="textbox"]'
    ) != null
  )
}

const hasExactModifiers = (event: KeyboardEvent, modifiers: string[]) => {
  const requiresCtrl = modifiers.includes('Ctrl')
  const requiresAlt = modifiers.includes('Alt')
  const requiresShift = modifiers.includes('Shift')
  const requiresMeta = modifiers.includes('Meta')

  return (
    event.ctrlKey === requiresCtrl &&
    event.altKey === requiresAlt &&
    event.shiftKey === requiresShift &&
    event.metaKey === requiresMeta
  )
}

const getShortcut = (event: KeyboardEvent) => {
  return GLOBAL_SHORTCUTS.find(shortcut => {
    if (shortcut.keys.length < 2) return false

    const key = shortcut.keys[shortcut.keys.length - 1]
    const modifiers = shortcut.keys.slice(0, -1)
    return (
      hasExactModifiers(event, modifiers) &&
      event.code === `Key${key.toUpperCase()}`
    )
  })
}

const submitActiveForm = (target: EventTarget | null) => {
  const element = target instanceof HTMLElement ? target : null
  const form = element?.closest('form')
  if (!form) return false

  if (typeof form.requestSubmit === 'function') {
    form.requestSubmit()
  } else {
    form.querySelector<HTMLButtonElement>('button[type="submit"]')?.click()
  }

  return true
}

const cancelActiveForm = (target: EventTarget | null) => {
  const element = target instanceof HTMLElement ? target : null
  const form = element?.closest('form')
  if (!form) return false

  const cancelButton = Array.from(
    form.querySelectorAll<HTMLButtonElement>('button')
  ).find(button =>
    /cancel/i.test(button.textContent?.trim() || button.ariaLabel || '')
  )

  if (!cancelButton) return false
  cancelButton.click()
  return true
}

export const useGlobalShortcuts = ({
  navigate,
  toggleSidebar,
  logout,
}: ShortcutHandlers) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const shortcut = getShortcut(event)
      if (!shortcut) return
      if (event.repeat) return

      const typing = isTypingTarget(event.target)
      const formAction =
        shortcut.action === 'save' || shortcut.action === 'cancel'

      if (typing && !formAction) return

      switch (shortcut.action) {
        case 'navigate':
          if (!shortcut.path) return
          event.preventDefault()
          navigate(shortcut.path)
          break
        case 'toggle-sidebar':
          event.preventDefault()
          toggleSidebar()
          break
        case 'save':
          if (submitActiveForm(event.target)) event.preventDefault()
          break
        case 'cancel':
          if (cancelActiveForm(event.target)) event.preventDefault()
          break
        case 'help':
          event.preventDefault()
          window.open(
            'https://mifosforge.jira.com/wiki/spaces/docs/pages/52035622/User+Manual',
            '_blank',
            'noopener,noreferrer'
          )
          break
        case 'logout':
          event.preventDefault()
          void logout()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [logout, navigate, toggleSidebar])
}
