/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons'

import {
  ResultsetColumnHeaderDataColumnDisplayTypeEnum as DisplayType,
  type ResultsetColumnHeaderData,
} from '@/fineract-api'
import { formatDate } from '@/lib/date-utils'
import { isJsonColumn, unwrapJsonCell } from '@/lib/datatable-json'
import { codeValuesOf } from '@/lib/datatables-api'
import JsonTreeView from '@/components/custom/json/JsonTreeView'

const EMPTY = '—'

export interface DatatableCellProps {
  header: ResultsetColumnHeaderData
  /** The cell exactly as it came off the wire. */
  value: unknown
  /** Compact rendering for a table cell, rather than a full-height panel. */
  compact?: boolean
}

/**
 * Renders one data table cell according to the column its value belongs to.
 *
 * JSON is checked before the display type, because Fineract reports a JSON
 * column as `TEXT` and only `columnType` tells the two apart.
 */
const DatatableCell = ({
  header,
  value,
  compact = false,
}: DatatableCellProps) => {
  const { i18n } = useTranslation()

  if (isJsonColumn(header)) {
    // No label: every surface that renders a cell already names the column
    // next to it, and repeating it inside the panel just reads as a stutter.
    return <JsonTreeView raw={unwrapJsonCell(value)} hideToolbar={compact} />
  }

  if (value === null || value === undefined || value === '') {
    return <span className="text-zinc-400 dark:text-zinc-500">{EMPTY}</span>
  }

  switch (header.columnDisplayType) {
    case DisplayType.Boolean:
      return (
        <FontAwesomeIcon
          icon={value ? faCircleCheck : faCircleXmark}
          className={value ? 'text-green-600' : 'text-zinc-400'}
        />
      )

    case DisplayType.Date:
      return (
        <span>{formatDate(value as string | number[], i18n.language)}</span>
      )

    case DisplayType.Datetime: {
      // Fineract sends a datetime as [y, m, d, h, min, s]; `formatDate` reads
      // the date part, and the time is appended so the two are not shown as
      // the same thing.
      const time = Array.isArray(value)
        ? `${String(value[3] ?? 0).padStart(2, '0')}:${String(value[4] ?? 0).padStart(2, '0')}`
        : typeof value === 'string' && value.includes('T')
          ? value.slice(11, 16)
          : ''
      return (
        <span>
          {formatDate(value as string | number[], i18n.language)}
          {time && ` ${time}`}
        </span>
      )
    }

    case DisplayType.Integer:
    case DisplayType.Decimal:
    case DisplayType.Float: {
      const numeric = Number(value)
      return (
        <span>
          {Number.isNaN(numeric)
            ? String(value)
            : new Intl.NumberFormat(i18n.language).format(numeric)}
        </span>
      )
    }

    case DisplayType.Codelookup:
    case DisplayType.Codevalue: {
      const match = codeValuesOf(header).find(option => option.id === value)
      return <span>{match?.value ?? String(value)}</span>
    }

    default:
      return <span className="break-words">{String(value)}</span>
  }
}

export default DatatableCell
