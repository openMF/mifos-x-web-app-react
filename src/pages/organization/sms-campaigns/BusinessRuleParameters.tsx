/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import AppSelect from '@/components/custom/select/AppSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import fineract from '@/lib/axios'
import { todayInputValue } from '@/lib/date-utils'

import {
  apiErrorMessage,
  rowToOption,
  rowToParameter,
  toApiDate,
  type ReportParameter,
  type SelectOption,
} from './types'

type ReportRows = { data?: Array<{ row: string[] }> }

/** The paramValue sent with a campaign: the report's variables plus its name */
export type ParamValue = Record<string, string> & { reportName: string }

type Props = {
  reportName: string
  /** Edit mode: the campaign's saved paramValue, shown read-only */
  saved?: Record<string, string>
  /** Called with the paramValue while every visible parameter has a value */
  onChange: (paramValue: ParamValue | null) => void
  /** Called with the report's column names, the placeholders for the message */
  onColumns: (columns: string[] | null) => void
}

/**
 * The business rule (report) parameters step of an SMS campaign, as in the
 * Angular web app: one input per report parameter, child selects reloaded
 * when their parent changes, and "Get parameters" to run the report and list
 * its columns as message placeholders.
 */
const BusinessRuleParameters = ({
  reportName,
  saved,
  onChange,
  onColumns,
}: Props) => {
  const { t } = useTranslation(['organization', 'common'])
  const [params, setParams] = useState<ReportParameter[] | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [options, setOptions] = useState<Record<string, SelectOption[]>>({})
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const readOnly = saved !== undefined

  const loadOptions = async (param: ReportParameter, query = '') => {
    const res = await fineract.get<ReportRows>(
      `v1/runreports/${param.name}${query}`,
      { params: { parameterType: true } }
    )
    const list = (res.data?.data ?? []).map(r => rowToOption(r.row))
    if (param.selectAll === 'Y')
      list.push({ id: '-1', name: t('common:actions.all') })
    return list
  }

  // Load the report's parameters, and the options of its top-level selects
  useEffect(() => {
    let stale = false
    setParams(null)
    setValues({})
    setOptions({})
    setError(null)
    onColumns(null)
    ;(async () => {
      try {
        const res = await fineract.get<ReportRows>(
          'v1/runreports/FullParameterList',
          { params: { R_reportListing: reportName, parameterType: true } }
        )
        const list = (res.data?.data ?? []).map(r => rowToParameter(r.row))
        const opts: Record<string, SelectOption[]> = {}
        const initial: Record<string, string> = {}
        for (const p of list) {
          if (saved) initial[p.name] = String(saved[p.variable] ?? '')
          if (p.displayType !== 'select') continue
          if (!p.parentParameterName) {
            opts[p.name] = await loadOptions(p)
          } else if (saved) {
            // A child select: its options depend on the parent's saved value
            const parent = list.find(x => x.name === p.parentParameterName)
            if (parent)
              opts[p.name] = await loadOptions(
                p,
                `?${parent.inputName}=${encodeURIComponent(saved[parent.variable] ?? '')}`
              )
          }
        }
        if (stale) return
        setParams(list)
        setOptions(opts)
        setValues(initial)
      } catch (err) {
        if (!stale)
          setError(apiErrorMessage(err, t('smsCampaign.errors.loadParameters')))
      }
    })()
    return () => {
      stale = true
    }
    // saved is read once per report; it does not change while editing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportName])

  const visible = useMemo(
    () =>
      (params ?? []).filter(
        p =>
          p.displayType !== 'none' &&
          (!p.parentParameterName || values[p.parentParameterName])
      ),
    [params, values]
  )

  // The value Fineract stores: report variable -> id, formatted date or text
  const paramValue = useMemo<ParamValue | null>(() => {
    if (!params) return null
    // Editing: the business rule is fixed, so send the saved value back as is
    if (saved) return { ...saved, reportName }
    if (!visible.every(p => values[p.name])) return null
    const out: Record<string, string> = {}
    for (const p of params) {
      if (p.parentParameterName && !values[p.parentParameterName]) continue
      if (p.displayType === 'none') out[p.variable] = p.defaultVal ?? ''
      else if (p.displayType === 'date')
        out[p.variable] = toApiDate(values[p.name])
      else out[p.variable] = values[p.name]
    }
    return { ...out, reportName }
  }, [params, saved, visible, values, reportName])

  useEffect(() => {
    onChange(paramValue)
    // onChange is a setter from the parent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramValue])

  // Latest request per child select: an older answer must not replace newer options
  const childRequests = useRef<Record<string, number>>({})

  const setValue = async (param: ReportParameter, value: string) => {
    onColumns(null)
    const children = (params ?? []).filter(
      p => p.parentParameterName === param.name
    )
    setValues(prev => {
      const next = { ...prev, [param.name]: value }
      for (const c of children) next[c.name] = ''
      return next
    })
    for (const child of children.filter(c => c.displayType === 'select')) {
      const request = (childRequests.current[child.name] ?? 0) + 1
      childRequests.current[child.name] = request
      try {
        const list = await loadOptions(
          child,
          `?${param.inputName}=${encodeURIComponent(value)}`
        )
        if (childRequests.current[child.name] !== request) continue
        setOptions(prev => ({ ...prev, [child.name]: list }))
      } catch (err) {
        if (childRequests.current[child.name] !== request) continue
        setError(apiErrorMessage(err, t('smsCampaign.errors.loadParameters')))
      }
    }
  }

  // Run the report once to learn its columns, as the Angular web app does
  const getColumns = async () => {
    if (!paramValue || running) return
    setRunning(true)
    setError(null)
    try {
      const query: Record<string, string> = {}
      for (const p of params ?? []) {
        if (paramValue[p.variable] !== undefined)
          query[p.inputName] = paramValue[p.variable]
      }
      const res = await fineract.get<{
        columnHeaders?: Array<{ columnName?: string }>
      }>(`v1/runreports/${encodeURIComponent(reportName)}`, {
        params: query,
      })
      onColumns(
        (res.data?.columnHeaders ?? [])
          .map(h => h.columnName ?? '')
          .filter(Boolean)
      )
    } catch (err) {
      onColumns(null)
      setError(apiErrorMessage(err, t('smsCampaign.errors.runReport')))
    } finally {
      setRunning(false)
    }
  }

  // In edit mode the parameters are fixed, so fetch the columns straight away
  useEffect(() => {
    if (readOnly && paramValue) getColumns()
    // run once the saved values are in place
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, paramValue !== null])

  if (error && !params)
    return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
  if (!params)
    return (
      <p className="text-sm text-muted-foreground">
        {t('common:actions.loading')}
      </p>
    )

  return (
    <div className="space-y-4">
      <h3 className="font-medium">{t('smsCampaign.businessRuleParameters')}</h3>
      {visible.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {t('smsCampaign.noParameters')}
        </p>
      )}
      <div className="flex flex-wrap gap-4">
        {visible.map(p => {
          if (readOnly) {
            const shown =
              p.displayType === 'select'
                ? (options[p.name]?.find(o => o.id === values[p.name])?.name ??
                  values[p.name])
                : values[p.name]
            return (
              <div key={p.name} className="w-full md:w-[48%] space-y-2">
                <Label>{p.label}</Label>
                <Input value={shown || '—'} disabled />
              </div>
            )
          }
          if (p.displayType === 'select')
            return (
              <AppSelect
                key={p.name}
                selectLabel={`${p.label} *`}
                selectPlaceholder={p.label}
                selectValue={values[p.name] ?? ''}
                selectOnChange={v => setValue(p, v)}
                selectOptions={options[p.name] ?? []}
              />
            )
          return (
            <div key={p.name} className="w-full md:w-[48%] space-y-2">
              <Label htmlFor={`param-${p.name}`}>{p.label} *</Label>
              <Input
                id={`param-${p.name}`}
                type={p.displayType === 'date' ? 'date' : 'text'}
                max={p.displayType === 'date' ? todayInputValue() : undefined}
                value={values[p.name] ?? ''}
                onChange={e => setValue(p, e.target.value)}
              />
            </div>
          )
        })}
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {!readOnly && (
        <Button
          type="button"
          variant="outline"
          disabled={!paramValue || running}
          onClick={getColumns}
        >
          {running
            ? t('common:actions.loading')
            : t('smsCampaign.getParameters')}
        </Button>
      )}
    </div>
  )
}

export default BusinessRuleParameters
