/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { AxiosError } from 'axios'

import { Button } from '@/components/ui/button'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons'

import { ReportsApi, type GetReportsResponse } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const reportsApi = new ReportsApi(getConfiguration())

type ReportsApiErrorResponse = {
  defaultUserMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}

const getErrorMessage = (error: unknown, fallback: string) => {
  const data = (error as AxiosError<ReportsApiErrorResponse>).response?.data
  return (
    data?.errors?.[0]?.defaultUserMessage ||
    data?.defaultUserMessage ||
    fallback
  )
}

const ViewReports = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [report, setReport] = useState<GetReportsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setReport(null)
    setError(null)
    setLoading(true)

    const reportId = Number(id)
    if (!id || !Number.isInteger(reportId) || reportId <= 0) {
      setError('Invalid report id.')
      setLoading(false)
      return
    }

    let ignore = false
    const fetchReport = async () => {
      try {
        const response = await reportsApi.retrieveReport(reportId, {
          params: { template: true },
        })
        if (!ignore) setReport(response.data)
      } catch (loadError) {
        if (ignore) return
        console.error('Failed to fetch report details', loadError)
        setError(getErrorMessage(loadError, 'Failed to load report details.'))
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    fetchReport()

    return () => {
      ignore = true
    }
  }, [id])

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'System', href: '/system' },
          { label: 'Manage Reports', href: '/system/reports' },
          { label: report?.reportName ?? id ?? '—', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        {loading ? (
          <p className="py-6 text-center text-muted-foreground">
            Loading report details...
          </p>
        ) : error ? (
          <p
            role="alert"
            className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300"
          >
            {error}
          </p>
        ) : report ? (
          <>
            {!report.coreReport && (
              <div className="flex justify-end mb-6">
                <Button
                  className="bg-[#1074b9] hover:bg-[#1074c9] text-white cursor-pointer"
                  onClick={() => navigate(`/system/reports/${id}/edit`)}
                >
                  <FontAwesomeIcon icon={faPenToSquare} /> Edit
                </Button>
              </div>
            )}

            <h2 className="text-xl font-semibold mb-6 text-zinc-800 dark:text-zinc-100">
              Report : {report.reportName}
            </h2>

            <div className="grid grid-cols-2 gap-y-5 text-sm text-zinc-700 dark:text-zinc-200">
              <div className="font-medium">Report Type:</div>
              <div className="text-zinc-600 dark:text-zinc-400">
                {report.reportType || '—'}
              </div>

              {report.reportSubType && (
                <>
                  <div className="font-medium">Report Sub Type:</div>
                  <div className="text-zinc-600 dark:text-zinc-400">
                    {report.reportSubType}
                  </div>
                </>
              )}

              <div className="font-medium">Report Category:</div>
              <div className="text-zinc-600 dark:text-zinc-400">
                {report.reportCategory || '—'}
              </div>

              <div className="font-medium">Core Report:</div>
              <div className="text-zinc-600 dark:text-zinc-400">
                {report.coreReport ? 'Yes' : 'No'}
              </div>

              <div className="font-medium">User Report:</div>
              <div className="text-zinc-600 dark:text-zinc-400">
                {report.useReport ? 'Yes' : 'No'}
              </div>
            </div>
          </>
        ) : null}

        {/* Back button */}
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            className="w-28 cursor-pointer"
            onClick={() => navigate('/system/reports')}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ViewReports
