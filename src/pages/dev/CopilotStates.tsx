/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import MifosLogo from '@/assets/images/MifosX_logo.png'
import { AiBadge } from '@/components/copilot/AiBadge'
import { Composer } from '@/components/copilot/Composer'
import { MessageList } from '@/components/copilot/MessageList'
import { WelcomeScreen } from '@/components/copilot/WelcomeScreen'
import { useTheme } from '@/hooks/use-theme'
import { isTurnActive, type CopilotThread } from '@/lib/copilot'
import { COPILOT_STATES } from './copilot-states'

/**
 * Every Copilot state on one page, for development and review only: the
 * route exists in dev builds and nowhere else. Open /dev/copilot-states.
 * Labels on this page are for developers and stay in English; everything
 * inside the panels follows the language picked above them.
 */
export default function CopilotStates() {
  const { isDark, setTheme } = useTheme()
  const { i18n } = useTranslation()

  useEffect(() => {
    document.title = 'Copilot states'
  }, [])

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3">
          <h1 className="me-auto text-lg font-semibold">Copilot states</h1>
          <label className="flex items-center gap-2 text-sm">
            Language
            <select
              value={i18n.language}
              onChange={event => void i18n.changeLanguage(event.target.value)}
              className="h-8 rounded-md border bg-background px-2"
            >
              {['en-US', 'es-ES', 'fr-FR', 'it-IT'].map(language => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="h-8 rounded-md border px-3 text-sm hover:bg-muted"
          >
            {isDark ? 'Light' : 'Dark'} theme
          </button>
        </div>
        <p className="mx-auto mt-1 max-w-[1400px] text-xs text-muted-foreground">
          Development only. Each panel replays recorded gateway frames
          (src/lib/copilot/recordings.ts) through the real translator and
          reducer.
        </p>
      </header>
      <main className="mx-auto grid max-w-[1400px] grid-cols-[repeat(auto-fill,minmax(min(100%,26.25rem),1fr))] gap-6 px-4 py-6 sm:px-6">
        {COPILOT_STATES.map(state => (
          <section
            key={state.id}
            id={state.id}
            aria-labelledby={`${state.id}-title`}
            className="flex flex-col gap-2"
          >
            <div>
              <h2 id={`${state.id}-title`} className="text-sm font-semibold">
                {state.title}
              </h2>
              <p className="text-xs text-muted-foreground">{state.note}</p>
            </div>
            <StateFrame thread={state.thread} />
          </section>
        ))}
      </main>
    </div>
  )
}

/**
 * The floating panel's look, without its window behaviour. The surface
 * classes mirror CopilotPanel's; keep them in step.
 */
function StateFrame({ thread }: { thread: CopilotThread }) {
  const { t } = useTranslation('copilot')
  const [draft, setDraft] = useState('')
  const busy = isTurnActive(thread.phase)
  let body: ReactNode
  if (!thread.messages.length) {
    body = (
      <WelcomeScreen onAsk={() => undefined} orbState="idle" spacious={false} />
    )
  } else {
    body = (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-5">
        <MessageList thread={thread} onAsk={() => undefined} />
      </div>
    )
  }

  return (
    <div className="@container/copilot relative isolate flex h-[36rem] flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/85 text-sm text-zinc-900 shadow-[0_24px_64px_-16px_rgb(0_0_0/0.3)] dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(70%_100%_at_50%_0%,rgb(16_116_185/0.13),transparent)] dark:bg-[radial-gradient(70%_100%_at_50%_0%,rgb(56_189_248/0.12),transparent)]"
      />
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-zinc-200/70 ps-3 pe-2 dark:border-white/10">
        <img src={MifosLogo} alt="" className="size-9 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm leading-5 font-semibold">
              {t('brand')}
            </p>
            <AiBadge />
          </div>
          <p
            className={
              busy
                ? 'truncate text-xs leading-4 text-[#1074b9] dark:text-sky-300'
                : 'truncate text-xs leading-4 text-zinc-500 dark:text-zinc-400'
            }
          >
            {busy ? t('status.working') : t('status.ready')}
          </p>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{body}</div>
      <div className="mx-auto w-full max-w-3xl shrink-0 px-4 pt-2 pb-3">
        <Composer
          text={draft}
          onTextChange={setDraft}
          busy={busy}
          onSend={() => ({ sent: false, reason: 'busy' })}
          onStop={() => undefined}
        />
      </div>
    </div>
  )
}
