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
import { useCopilotDisplayMode } from '@/hooks/use-copilot-display-mode'
import { isTurnActive, type TurnPhase } from '@/lib/copilot'
import { envConfig } from '@/lib/env-config'
import { cn } from '@/lib/utils'
import { canUseCopilot, replyArrived } from './copilot-ui'

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
 * the Copilot is switched on and allowed.
 */
export function CopilotLauncher() {
  const permissions = useAppSelector(
    state => (state.auth.user as { permissions?: unknown } | null)?.permissions
  )
  if (!canUseCopilot(envConfig.copilotEnabled, permissions)) return null
  return <Launcher />
}

/**
 * Always in the same place, and it stays there while the panel is open:
 * one press opens the panel, the next minimises it. A dot says a reply
 * arrived while the panel was closed.
 */
function Launcher() {
  const { t } = useTranslation('copilot')
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [phase, setPhase] = useState<TurnPhase>('idle')
  const [unread, setUnread] = useState(false)
  const [mode, setMode] = useCopilotDisplayMode()

  // A turn keeps running after the panel is minimised; when it ends, the
  // officer is told there is something to read.
  const previousPhase = useRef(phase)
  useEffect(() => {
    const was = previousPhase.current
    previousPhase.current = phase
    if (!open && replyArrived(was, phase)) setUnread(true)
  }, [phase, open])

  const changeOpen = (next: boolean) => {
    if (next) {
      setMounted(true)
      setUnread(false)
    }
    setOpen(next)
  }

  const working = isTurnActive(phase)
  const label = open
    ? t('launcher.minimise')
    : unread
      ? t('launcher.unread')
      : phase === 'thinking'
        ? t('launcher.working')
        : phase === 'streaming'
          ? t('launcher.replying')
          : t('openAssistant')

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
            {unread && !open && (
              <span
                aria-hidden="true"
                className="absolute top-0.5 right-0.5 size-3 rounded-full bg-red-500 ring-2 ring-white dark:ring-zinc-800"
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
            onPhaseChange={setPhase}
            mode={mode}
            onModeChange={setMode}
            returnFocusRef={buttonRef}
          />
        </Suspense>
      )}
    </>
  )
}
