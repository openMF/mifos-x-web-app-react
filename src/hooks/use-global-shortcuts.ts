import { useEffect } from 'react'

export type GlobalShortcut = {
  id: string
  keys: string[]
  description: string
  action: 'navigate' | 'toggle-sidebar' | 'save' | 'cancel' | 'help' | 'logout'
  path?: string
}

export const GLOBAL_SHORTCUTS: GlobalShortcut[] = [
  {
    id: 'toggle-sidebar',
    keys: ['Ctrl', 'B'],
    description: 'Toggle Sidebar',
    action: 'toggle-sidebar',
  },
  {
    id: 'navigation',
    keys: ['Ctrl', 'N'],
    description: 'Navigation Page',
    action: 'navigate',
    path: '/navigation',
  },
  {
    id: 'run-report',
    keys: ['Ctrl', 'T'],
    description: 'Run Report',
    action: 'navigate',
    path: '/reports',
  },
  {
    id: 'checker-inbox',
    keys: ['Ctrl', 'I'],
    description: 'Checker Inbox & Pending Tasks',
    action: 'navigate',
    path: '/checker-inbox-and-tasks/checker-inbox',
  },
  {
    id: 'create-client',
    keys: ['Alt', 'C'],
    description: 'Create Client',
    action: 'navigate',
    path: '/clients/create',
  },
  {
    id: 'create-group',
    keys: ['Ctrl', 'G'],
    description: 'Create Group',
    action: 'navigate',
    path: '/groups/create',
  },
  {
    id: 'create-center',
    keys: ['Ctrl', 'Q'],
    description: 'Create Center',
    action: 'navigate',
    path: '/centers/create',
  },
  {
    id: 'frequent-posting',
    keys: ['Ctrl', 'F'],
    description: 'Frequent Posting',
    action: 'navigate',
    path: '/accounting/journal-entries/frequent-postings',
  },
  {
    id: 'closure-entries',
    keys: ['Ctrl', 'E'],
    description: 'Closure Entries',
    action: 'navigate',
    path: '/accounting/closing-entries',
  },
  {
    id: 'journal-entry',
    keys: ['Ctrl', 'J'],
    description: 'Journal Entry',
    action: 'navigate',
    path: '/accounting/journal-entries/create',
  },
  {
    id: 'reports',
    keys: ['Ctrl', 'R'],
    description: 'Reports',
    action: 'navigate',
    path: '/reports',
  },
  {
    id: 'accounting',
    keys: ['Alt', 'A'],
    description: 'Accounting',
    action: 'navigate',
    path: '/accounting',
  },
  {
    id: 'save-form',
    keys: ['Alt', 'S'],
    description: 'Save/Submit Forms',
    action: 'save',
  },
  {
    id: 'cancel-form',
    keys: ['Alt', 'X'],
    description: 'Cancel',
    action: 'cancel',
  },
  {
    id: 'help',
    keys: ['Alt', 'H'],
    description: 'Help',
    action: 'help',
  },
  {
    id: 'logout',
    keys: ['Ctrl', 'L'],
    description: 'Logout',
    action: 'logout',
  },
]

type ShortcutHandlers = {
  navigate: (path: string) => void
  toggleSidebar: () => void
  logout: () => void | Promise<void>
}

const isTypingTarget = (target: EventTarget | null) => {
  const element = target instanceof HTMLElement ? target : null

  return (
    element?.matches(
      'input, textarea, select, [contenteditable="true"], [role="textbox"]'
    ) ?? false
  )
}

const hasExactModifiers = (
  event: KeyboardEvent,
  modifier: string | undefined
) => {
  if (modifier === 'Ctrl') {
    return event.ctrlKey !== event.metaKey && !event.altKey && !event.shiftKey
  }

  if (modifier === 'Alt') {
    return !event.ctrlKey && !event.metaKey && event.altKey && !event.shiftKey
  }

  return !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey
}

const getShortcut = (event: KeyboardEvent) => {
  return GLOBAL_SHORTCUTS.find(shortcut => {
    if (shortcut.keys.length !== 2) return false

    const [modifier, key] = shortcut.keys
    return (
      hasExactModifiers(event, modifier) &&
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
  ).find(button => /cancel/i.test(button.textContent ?? button.ariaLabel ?? ''))

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
