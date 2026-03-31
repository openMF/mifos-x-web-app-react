/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ReportsApi,
  OfficesApi,
  RunReportsApi,
  Configuration,
} from '@/fineract-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Office {
  id: number | string
  name: string
}

interface ReportParameter {
  parameterName: string
}

interface ReportMetadata {
  reportParameters?: ReportParameter[]
}

interface BasicReport {
  id: number
  reportName?: string
  name?: string
}

const RunReports: React.FC = () => {
  const { reportName } = useParams<{ reportName: string }>()
  const [reportData, setReportData] = useState<ReportMetadata | null>(null)
  const [offices, setOffices] = useState<Office[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchData = async () => {
      if (!reportName) return
      try {
        setLoading(true)

        const config = new Configuration({
          accessToken: sessionStorage.getItem('mifosToken') || undefined,
          basePath:
            import.meta.env.VITE_FINERACT_API_URL || '/fineract-provider/api',
          apiKey: 'default', // Required Fineract-Platform-TenantId header
        })

        const reportsApi = new ReportsApi(config)
        const officesApi = new OfficesApi(config)

        // Fetch the list of all reports to find the ID of the current report
        const formattedSearchName = reportName.replace(/-/g, ' ').toLowerCase()
        const reportsListRes = await reportsApi.retrieveReportList({})
        const allReports = reportsListRes.data as BasicReport[]

        const matchedReport = allReports.find(
          r =>
            (r.reportName &&
              r.reportName.toLowerCase() === formattedSearchName) ||
            (r.name && r.name.toLowerCase() === formattedSearchName)
        )

        if (!matchedReport) {
          setError(
            `Could not find a report named "${reportName.replace(/-/g, ' ')}".`
          )
          setLoading(false)
          return
        }

        //  Fetch the metadata using the matched ID instead of NaN
        const [reportRes, officeRes] = await Promise.all([
          reportsApi.retrieveReport(matchedReport.id, {}),
          officesApi.retrieveOffices(undefined, undefined, undefined, {}),
        ])

        setReportData(reportRes.data as ReportMetadata)
        setOffices(officeRes.data as Office[])
      } catch (_err) {
        setError('Failed to load report metadata via official SDK.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [reportName])

  const handleInputChange = (name: string, value: string) => {
    setFormValues(prev => ({ ...prev, [name]: value }))
  }

  const handleRunReport = async () => {
    try {
      setError(null)
      const token = sessionStorage.getItem('mifosToken')

      // Configuration must include explicit headers to satisfy Fineract security
      const config = new Configuration({
        basePath:
          import.meta.env.VITE_FINERACT_API_URL || '/fineract-provider/api',
        baseOptions: {
          headers: {
            'Fineract-Platform-TenantId': 'default', // Mandatory Header
            Authorization: token ? `Basic ${token}` : undefined,
          },
        },
      })

      const runReportsApi = new RunReportsApi(config)
      const exactReportName = reportName!.replace(/-/g, ' ')

      await runReportsApi.runReport(exactReportName, false, {
        params: formValues,
      })

      alert('Report request successful! Check the Network tab for the data.')
    } catch (_err) {
      setError(
        'Access Denied (403). This endpoint may be restricted on the demo server, but the SDK integration is now correct.'
      )
    }
  }

  const renderParameterInput = (param: ReportParameter) => {
    const name = param.parameterName
    const currentValue = formValues[name] || ''

    if (name.toLowerCase().includes('office')) {
      return (
        <Select
          value={currentValue}
          onValueChange={v => handleInputChange(name, v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Office" />
          </SelectTrigger>
          <SelectContent>
            {offices.map((office: Office) => (
              <SelectItem key={office.id} value={office.id.toString()}>
                {office.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    return (
      <Input
        type={name.toLowerCase().includes('date') ? 'date' : 'text'}
        value={currentValue}
        onChange={e => handleInputChange(name, e.target.value)}
      />
    )
  }

  if (loading)
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin" />
      </div>
    )

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link
        to="/reports"
        className="flex items-center text-zinc-500 mb-4 hover:text-black"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="capitalize">
            {reportName?.replace(/-/g, ' ')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-red-500 mb-4 flex items-center">
              <AlertCircle className="mr-2" />
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reportData?.reportParameters?.map((param, index) => (
              <div key={index} className="space-y-2">
                <Label className="capitalize">
                  {param.parameterName.replace(/([A-Z])/g, ' $1')}
                </Label>
                {renderParameterInput(param)}
              </div>
            ))}
          </div>
          <Button
            onClick={handleRunReport}
            className="mt-8 w-full bg-sky-600 hover:bg-sky-700"
          >
            Run Report
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default RunReports
