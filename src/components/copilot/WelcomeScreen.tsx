/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  ArrowRight,
  PiggyBank,
  Search,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CopilotOrb } from './CopilotOrb'
import { dayPart } from './copilot-ui'
import type { OrbState } from './orb/orb-state'

/** Three at most, so the choice is quick to take in. */
const STARTERS: {
  key: 'overdueLoans' | 'findClient' | 'savingsBalance'
  icon: LucideIcon
}[] = [
  { key: 'overdueLoans', icon: TriangleAlert },
  { key: 'findClient', icon: Search },
  { key: 'savingsBalance', icon: PiggyBank },
]

/** Each part arrives a beat after the one above it. */
const RISE =
  'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:fill-mode-backwards motion-safe:duration-500'

/** What an empty conversation shows: the assistant, a greeting, and where to start. */
export function WelcomeScreen({
  onAsk,
  name,
  orbState,
  spacious,
}: {
  onAsk: (text: string) => void
  /** The signed-in officer, when the app knows who it is. */
  name?: string
  orbState: OrbState
  /** True when the panel fills the screen and there is room to breathe. */
  spacious: boolean
}) {
  const { t } = useTranslation('copilot')
  const greeting = t(`greeting.${dayPart(new Date().getHours())}`)

  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-center gap-6 px-5 py-8">
      <div className="flex flex-col items-center text-center">
        <CopilotOrb
          state={orbState}
          size={spacious ? 136 : 104}
          className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-90 motion-safe:duration-700"
        />
        <p
          style={{ animationDelay: '80ms' }}
          className={`mt-4 inline-flex h-7 items-center rounded-full bg-[#1074b9]/10 px-3 text-xs font-semibold text-[#1074b9] dark:bg-sky-400/10 dark:text-sky-300 ${RISE}`}
        >
          {name ? t('greeting.withName', { greeting, name }) : greeting}
        </p>
        <h2
          style={{ animationDelay: '160ms' }}
          className={`mt-3 text-2xl leading-tight font-semibold tracking-tight text-balance text-zinc-900 @2xl/copilot:text-4xl dark:text-zinc-50 ${RISE}`}
        >
          {t('greeting.question')}
        </h2>
      </div>

      <ul
        className="grid w-full gap-2 @2xl/copilot:grid-cols-3 @2xl/copilot:gap-3"
        aria-label={t('starters.label')}
      >
        {STARTERS.map(({ key, icon: Icon }, index) => (
          <li
            key={key}
            style={{ animationDelay: `${240 + index * 90}ms` }}
            className={RISE}
          >
            <button
              type="button"
              onClick={() => onAsk(t(`starters.${key}.title`))}
              className="group flex size-full items-center gap-3 rounded-xl border border-zinc-200/80 bg-white/70 p-3 text-left shadow-xs transition-[border-color,background-color,box-shadow,translate] duration-200 outline-none hover:-translate-y-0.5 hover:border-[#1074b9]/40 hover:bg-white hover:shadow-md focus-visible:border-[#1074b9] focus-visible:ring-[3px] focus-visible:ring-[#1074b9]/20 motion-reduce:transition-none motion-reduce:hover:translate-y-0 @2xl/copilot:flex-col @2xl/copilot:items-start @2xl/copilot:p-4 dark:border-white/10 dark:bg-white/5 dark:hover:border-sky-400/40 dark:hover:bg-white/10"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#1074b9]/10 text-[#1074b9] transition-colors group-hover:bg-[#1074b9] group-hover:text-white dark:bg-sky-400/10 dark:text-sky-300 dark:group-hover:bg-sky-400 dark:group-hover:text-zinc-900">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {t(`starters.${key}.title`)}
                </span>
                <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                  {t(`starters.${key}.description`)}
                </span>
              </span>
              <ArrowRight
                className="size-4 shrink-0 -translate-x-1 text-[#1074b9] opacity-0 transition-[opacity,translate] duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 @2xl/copilot:hidden dark:text-sky-300"
                aria-hidden="true"
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
