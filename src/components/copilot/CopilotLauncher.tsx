/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Suspense, lazy, useEffect, useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import MifosLogo from '@/assets/images/MifosX_logo.png'
import { useAppSelector } from '@/app/hook'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useCopilotActions, useCopilotState } from '@/hooks/use-copilot'
import { useCopilotDisplayMode } from '@/hooks/use-copilot-display-mode'
import { copilotGatewayMode } from '@/lib/copilot'
import { envConfig } from '@/lib/env-config'
import { cn } from '@/lib/utils'
import {
  canUseCopilot,
  launcherStatus,
  type LauncherStatus,
} from './copilot-ui'

const loadPanel = () => import('./CopilotPanel')
// The panel is only downloaded once someone opens it, so a deployment that
// never uses the Copilot pays nothing for it.
const CopilotPanel = lazy(loadPanel)

/** The two icons trade places: a quick scale, fade and blur. */
const ICON_SWAP =
  'absolute transition-[scale,opacity,filter] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none'
const ICON_SHOWN = 'scale-100 opacity-100 blur-[0px]'
const ICON_HIDDEN = 'scale-25 opacity-0 blur-[4px]'

/**
 * The floating Copilot button, bottom right on every page, shown only where
 * the Copilot is switched on, has a gateway to talk to, and is allowed.
 */
export function CopilotLauncher() {
  const permissions = useAppSelector(
    state => (state.auth.user as { permissions?: unknown } | null)?.permissions
  )
  // Switched on but with no usable gateway: say so once, for whoever set the
  // deployment up, and offer nothing. Recorded answers are never a fallback.
  const unconfigured =
    envConfig.copilotEnabled && copilotGatewayMode() === 'off'
  useEffect(() => {
    if (unconfigured) {
      console.warn(
        'Copilot is enabled but hidden: set MIFOS_COPILOT_MCP_BASE_URL to the https URL of the gateway.'
      )
    }
  }, [unconfigured])

  if (unconfigured) return null
  if (!canUseCopilot(envConfig.copilotEnabled, permissions)) return null
  return <Launcher />
}

/** What the closed button says for each status. */
const STATUS_LABEL = {
  idle: 'openAssistant',
  working: 'launcher.working',
  replying: 'launcher.replying',
  ready: 'launcher.unread',
  approval: 'launcher.approval',
} as const satisfies Record<LauncherStatus, string>

/**
 * Always in the same place, and it stays there while the panel is open:
 * one press opens the panel, the next minimises it. While the panel is
 * closed it says what the Copilot is doing: a ring while it works, a dot
 * when a reply is waiting, an amber dot when a confirmation is.
 */
function Launcher() {
  const { t } = useTranslation('copilot')
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const { thread, open, unread } = useCopilotState()
  const { setOpen } = useCopilotActions()
  // The panel's code is fetched on first open, then kept for the session.
  const [mounted, setMounted] = useState(open)
  const [mode, setMode] = useCopilotDisplayMode()

  const changeOpen = (next: boolean) => {
    if (next) setMounted(true)
    setOpen(next)
  }

  const status = launcherStatus({
    phase: thread.phase,
    unread,
    approvalPending: thread.pendingApproval !== null,
  })
  const working = status === 'working' || status === 'replying'
  const label = open ? t('launcher.minimise') : t(STATUS_LABEL[status])

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild aria-describedby={undefined}>
          <button
            ref={buttonRef}
            type="button"
            data-state={open ? 'open' : 'closed'}
            className={cn(
              'fixed right-6 bottom-6 z-50 grid size-14 cursor-pointer place-items-center rounded-full outline-none',
              'border border-zinc-200 bg-white text-[#1074b9] dark:border-zinc-700 dark:bg-zinc-800 dark:text-sky-300',
              'shadow-[0_8px_24px_rgb(0_0_0/0.16)] transition-[box-shadow,scale] duration-150 ease-out hover:shadow-[0_8px_32px_rgb(0_0_0/0.24)] active:scale-96 motion-reduce:transition-none',
              'focus-visible:ring-[3px] focus-visible:ring-[#1074b9]/40',
              // Docked and full screen panels have their own close button,
              // and a phone's panel covers the corner.
              open && (mode === 'floating' ? 'max-sm:hidden' : 'hidden')
            )}
            onClick={() => changeOpen(!open)}
            // Fetch the panel while the pointer is on its way to the click.
            onPointerEnter={() => void loadPanel()}
            onFocus={() => void loadPanel()}
            aria-label={label}
            aria-expanded={open}
            aria-controls={mounted ? panelId : undefined}
          >
            <img
              src={MifosLogo}
              alt=""
              className={cn(
                'size-11',
                ICON_SWAP,
                open ? ICON_HIDDEN : ICON_SHOWN
              )}
            />
            <ChevronDown
              aria-hidden="true"
              className={cn(
                'size-6',
                ICON_SWAP,
                open ? ICON_SHOWN : ICON_HIDDEN
              )}
            />
            {working && !open && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-1 rounded-full border-2 border-[#1074b9]/25 border-t-[#1074b9] motion-safe:animate-spin"
              />
            )}
            {(status === 'ready' || status === 'approval') && !open && (
              <span
                aria-hidden="true"
                data-status={status}
                className={cn(
                  'absolute top-0.5 right-0.5 size-3 rounded-full ring-2 ring-white dark:ring-zinc-800',
                  status === 'approval' ? 'bg-amber-500' : 'bg-red-500'
                )}
              />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">{label}</TooltipContent>
      </Tooltip>
      {mounted && (
        <Suspense fallback={null}>
          <CopilotPanel
            id={panelId}
            open={open}
            onOpenChange={changeOpen}
            mode={mode}
            onModeChange={setMode}
            returnFocusRef={buttonRef}
          />
        </Suspense>
      )}
    </>
  )
}
