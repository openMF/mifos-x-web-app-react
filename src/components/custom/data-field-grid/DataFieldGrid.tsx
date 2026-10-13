/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/** One read-only value, shown as a labelled card. */
export interface DataField {
  /** Unique within its grid. */
  key: string
  label: string
  value: ReactNode
  /** Spans two columns on wide screens, for long values. */
  wide?: boolean
}

/** Read-only values laid out as labelled cards, four to a row on wide screens. */
export const DataFieldGrid = ({ fields }: { fields: DataField[] }) => (
  <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {fields.map(field => (
      <div
        key={field.key}
        className={cn(
          'rounded-md border border-zinc-200 p-3 dark:border-zinc-700',
          field.wide && 'lg:col-span-2'
        )}
      >
        <dt className="text-xs font-medium uppercase tracking-wide text-[#0e77b7] dark:text-sky-400">
          {field.label}
        </dt>
        <dd className="mt-1 text-sm break-words text-black dark:text-white">
          {field.value}
        </dd>
      </div>
    ))}
  </dl>
)

/** A titled block of a read-only view; the title is left out to continue the previous one. */
export const DataSection = ({
  title,
  children,
}: {
  title?: string
  children: ReactNode
}) => (
  <section className="space-y-3">
    {title && (
      <h3 className="border-b border-zinc-200 pb-2 text-lg font-semibold uppercase text-black dark:border-zinc-700 dark:text-white">
        {title}
      </h3>
    )}
    {children}
  </section>
)
