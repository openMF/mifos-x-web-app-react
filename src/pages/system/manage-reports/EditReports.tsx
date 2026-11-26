/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { AxiosError } from 'axios'
import { Plus, Trash2 } from 'lucide-react'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ReportsApi,
  type GetReportsResponse,
  type GetReportsTemplateResponse,
  type PutReportRequest,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const reportsApi = new ReportsApi(getConfiguration())

type ReportsApiErrorResponse = {
  defaultUserMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}

type ParameterOption = {
  id: string
  parameterName: string
}

type ReportParameter = {
  id?: number | string
  parameterId: string
  reportParameterName: string
  wasPersisted: boolean
  uiKey: string
  originalUsageId?: number | string
  originalParameterId: string
  originalReportParameterName: string
  persistedParameterName: string
}

const errorMessage = (error: unknown, fallback: string) => {
  const data = (error as AxiosError<ReportsApiErrorResponse>).response?.data
  return (
    data?.errors?.[0]?.defaultUserMessage ||
    data?.defaultUserMessage ||
    fallback
  )
}

const toRecord = (value: object): Record<string, unknown> =>
  Object.fromEntries(Object.entries(value))

const readIdentifier = (value: unknown): number | string | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.length > 0) return value
  return undefined
}

const readText = (value: unknown): string =>
  typeof value === 'string' ? value : ''

const EditReports = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const reportId = Number(id)

  const [report, setReport] = useState<GetReportsResponse | null>(null)
  const [parameterOptions, setParameterOptions] = useState<ParameterOption[]>(
    []
  )
  const [reportName, setReportName] = useState('')
  const [originalReportName, setOriginalReportName] = useState('')
  const [parameters, setParameters] = useState<ReportParameter[]>([])
  const [originalParameterCount, setOriginalParameterCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const saveOwner = useRef(0)
  const nextParameterUiKey = useRef(0)

  useEffect(() => {
    const owner = ++saveOwner.current
    return () => {
      if (saveOwner.current === owner) saveOwner.current += 1
    }
  }, [id])

  useEffect(() => {
    setReport(null)
    setParameterOptions([])
    setReportName('')
    setOriginalReportName('')
    setParameters([])
    setOriginalParameterCount(0)
    setError(null)
    setLoading(true)
    setSaving(false)

    if (!id || !Number.isInteger(reportId) || reportId <= 0) {
      setError('Invalid report id.')
      setLoading(false)
      return
    }

    let ignore = false
    const loadReport = async () => {
      try {
        const [reportResponse, templateResponse] = await Promise.all([
          reportsApi.retrieveReport(reportId),
          reportsApi.retrieveOfficeTemplate(),
        ])
        if (ignore) return

        const reportData = reportResponse.data
        const templateData: GetReportsTemplateResponse =
          templateResponse.data ?? {}
        const options = (templateData.allowedParameters ?? []).flatMap(
          option => {
            const record = toRecord(option)
            const optionId = readIdentifier(record.id)
            const name = readText(record.parameterName)
            return optionId === undefined || !name
              ? []
              : [{ id: String(optionId), parameterName: name }]
          }
        )
        const existingParameters = (reportData.reportParameters ?? []).flatMap(
          parameter => {
            const record = toRecord(parameter)
            const selectedId = readIdentifier(record.parameterId)
            const parameterName = readText(record.parameterName)
            const matchingOption = options.find(
              option => option.parameterName === parameterName
            )
            const parameterId =
              selectedId === undefined
                ? (matchingOption?.id ?? '')
                : String(selectedId)
            const id = readIdentifier(record.id)
            const reportParameterName = readText(record.reportParameterName)

            return [
              {
                id,
                parameterId,
                reportParameterName,
                wasPersisted: true,
                uiKey: `parameter-${++nextParameterUiKey.current}`,
                originalUsageId: id,
                originalParameterId: parameterId,
                originalReportParameterName: reportParameterName,
                persistedParameterName: parameterName,
              },
            ]
          }
        )

        setReport(reportData)
        setParameterOptions(options)
        const loadedReportName = reportData.reportName ?? ''
        setReportName(loadedReportName)
        setOriginalReportName(loadedReportName)
        setParameters(existingParameters)
        setOriginalParameterCount(existingParameters.length)
      } catch (loadError) {
        if (ignore) return
        console.error('Failed to load report for editing', loadError)
        setError(errorMessage(loadError, 'Failed to load report for editing.'))
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadReport()
    return () => {
      ignore = true
    }
  }, [id, reportId])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!report || report.id !== reportId || report.coreReport || saving) {
      return
    }

    const trimmedName = reportName.trim()
    if (!trimmedName) {
      setError('Report name is required.')
      return
    }
    if (
      parameters.some(
        parameter =>
          !parameter.wasPersisted &&
          (!parameter.parameterId ||
            !Number.isInteger(Number(parameter.parameterId)))
      )
    ) {
      setError('Select a valid allowed parameter for each report parameter.')
      return
    }

    setSaving(true)
    setError(null)
    const owner = saveOwner.current
    const parametersChanged =
      parameters.length !== originalParameterCount ||
      parameters.some(parameter =>
        parameter.wasPersisted
          ? parameter.parameterId !== parameter.originalParameterId ||
            parameter.reportParameterName !==
              parameter.originalReportParameterName ||
            parameter.id !== parameter.originalUsageId
          : true
      )
    const request: PutReportRequest = {}
    if (trimmedName !== originalReportName.trim()) {
      request.reportName = trimmedName
    }
    if (parametersChanged) {
      request.reportParameters = parameters.flatMap(parameter => {
        if (
          parameter.wasPersisted &&
          parameter.parameterId === '' &&
          parameter.id !== undefined
        ) {
          return [
            {
              id: parameter.id,
              reportParameterName:
                parameter.reportParameterName.trim() ||
                (parameter.originalReportParameterName ? '' : undefined),
            },
          ]
        }
        if (!parameter.parameterId) return []
        return [
          {
            id: parameter.id ?? '',
            parameterId: Number(parameter.parameterId),
            reportParameterName:
              parameter.reportParameterName.trim() ||
              (parameter.wasPersisted ? '' : undefined),
            parameterName: undefined,
          },
        ]
      })
    }

    try {
      await reportsApi.updateReport(reportId, request)
      if (saveOwner.current === owner) {
        navigate(`/system/reports/${reportId}`)
      }
    } catch (saveError) {
      console.error('Failed to update report', saveError)
      if (saveOwner.current === owner) {
        setError(errorMessage(saveError, 'Failed to update report.'))
        setSaving(false)
      }
    }
  }

  const updateParameter = (index: number, update: Partial<ReportParameter>) => {
    setParameters(current =>
      current.map((parameter, parameterIndex) => {
        if (parameterIndex !== index) return parameter

        const parameterChanged =
          update.parameterId !== undefined &&
          update.parameterId !== parameter.parameterId
        const id = parameterChanged
          ? update.parameterId === parameter.originalParameterId
            ? parameter.originalUsageId
            : undefined
          : parameter.id

        return { ...parameter, ...update, id }
      })
    )
    setError(null)
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'System', href: '/system' },
          { label: 'Manage Reports', href: '/system/reports' },
          {
            label: report?.reportName ?? id ?? '—',
            href: `/system/reports/${id}`,
          },
          { label: 'Edit', current: true },
        ]}
      />

      <div className="mx-auto max-w-3xl rounded-lg border bg-white p-8 shadow dark:bg-zinc-900">
        <h1 className="mb-6 text-2xl font-semibold">Edit Report</h1>

        {loading ? (
          <p className="py-4 text-sm text-muted-foreground">
            Loading report...
          </p>
        ) : error && !report ? (
          <p
            role="alert"
            className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300"
          >
            {error}
          </p>
        ) : report ? (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="reportName">Report Name</Label>
              <Input
                id="reportName"
                value={reportName}
                required
                disabled={saving || report.coreReport}
                onChange={event => {
                  setReportName(event.target.value)
                  setError(null)
                }}
              />
            </div>

            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-medium">Report Parameters</h2>
                {!report.coreReport && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving || parameterOptions.length === 0}
                    onClick={() => {
                      setParameters(current => [
                        ...current,
                        {
                          parameterId: '',
                          reportParameterName: '',
                          wasPersisted: false,
                          uiKey: `new-parameter-${++nextParameterUiKey.current}`,
                          originalParameterId: '',
                          originalReportParameterName: '',
                          persistedParameterName: '',
                        },
                      ])
                      setError(null)
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Parameter
                  </Button>
                )}
              </div>

              {parameters.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No report parameters.
                </p>
              ) : (
                <div className="space-y-4">
                  {parameters.map((parameter, index) => (
                    <div
                      key={parameter.uiKey}
                      className="grid gap-3 rounded-md border p-4 md:grid-cols-[1fr_1fr_auto]"
                    >
                      <div className="space-y-2">
                        <Label htmlFor={`parameter-${index}`}>
                          Allowed Parameter
                        </Label>
                        <Select
                          value={parameter.parameterId}
                          onValueChange={value =>
                            updateParameter(index, { parameterId: value })
                          }
                          disabled={saving || report.coreReport}
                        >
                          <SelectTrigger id={`parameter-${index}`}>
                            <SelectValue
                              placeholder={
                                parameter.persistedParameterName &&
                                !parameterOptions.some(
                                  option => option.id === parameter.parameterId
                                )
                                  ? parameter.persistedParameterName
                                  : 'Select a parameter'
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {parameterOptions.map(option => (
                              <SelectItem key={option.id} value={option.id}>
                                {option.parameterName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`engine-parameter-${index}`}>
                          Parameter Name Passed to Report Engine
                        </Label>
                        <Input
                          id={`engine-parameter-${index}`}
                          value={parameter.reportParameterName}
                          disabled={saving || report.coreReport}
                          onChange={event =>
                            updateParameter(index, {
                              reportParameterName: event.target.value,
                            })
                          }
                        />
                      </div>
                      {!report.coreReport && (
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="outline"
                            aria-label={`Remove parameter ${index + 1}`}
                            disabled={saving}
                            onClick={() => {
                              setParameters(current =>
                                current.filter(
                                  (_, parameterIndex) =>
                                    parameterIndex !== index
                                )
                              )
                              setError(null)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {error && (
              <p
                role="alert"
                className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300"
              >
                {error}
              </p>
            )}

            <div className="flex justify-center gap-4 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => navigate(`/system/reports/${reportId}`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#1074b9] text-white hover:bg-[#1074c9]"
                disabled={saving || report.coreReport}
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  )
}

export default EditReports
