/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { JsonTreeView } from '@/components/custom/json'
import { Button } from '@/components/ui/button'
import { AuditsApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import { formatAuditDateTime } from './format'
import type { AuditEntry } from './types'

const auditsApi = new AuditsApi(getConfiguration())

/** Field label and value, in the order the Angular web app shows them */
const FIELDS: Array<[string, keyof AuditEntry]> = [
  ['ID', 'id'],
  ['Action', 'actionName'],
  ['Entity', 'entityName'],
  ['Resource ID', 'resourceId'],
  ['Subresource ID', 'subresourceId'],
  ['Status', 'processingResult'],
  ['Made By', 'maker'],
  ['Made On', 'madeOnDate'],
  ['Checker', 'checker'],
  ['Checked On', 'checkedOnDate'],
  ['Office', 'officeName'],
  ['Group', 'groupName'],
  ['Client', 'clientName'],
  ['Loan Account', 'loanAccountNo'],
  ['Savings Account', 'savingsAccountNo'],
]

/** System > Audit Trails > one entry (GET /audits/{id}) */
const ViewAuditTrail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [audit, setAudit] = useState<AuditEntry | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false
    setAudit(null)
    setError(null)
    const auditId = Number(id)
    if (!Number.isInteger(auditId) || auditId <= 0) {
      setError('This audit entry does not exist.')
      return
    }
    const fetchAudit = async () => {
      try {
        const res = await auditsApi.retrieveAuditEntry(auditId)
        if (ignore) return
        // The generated client types this response as AuditData
        setAudit(res.data as unknown as AuditEntry)
      } catch (err) {
        if (ignore) return
        console.error('Failed to fetch audit entry', err)
        setError('Failed to load this audit entry.')
      }
    }
    fetchAudit()
    return () => {
      ignore = true
    }
  }, [id])

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'System', href: '/system' },
          { label: 'Audit Trails', href: '/system/audit-trails' },
          { label: `Audit ${id}`, current: true },
        ]}
      />

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Audit {id}</h1>
        <Button
          variant="outline"
          onClick={() => navigate('/system/audit-trails')}
        >
          Back
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {!audit && !error && <div className="text-center py-6">Loading...</div>}

      {audit && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-md border p-6 shadow">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              {FIELDS.filter(
                ([, key]) => audit[key] !== undefined && audit[key] !== null
              ).map(([label, key]) => (
                <div key={key} className="flex gap-4">
                  <dt className="w-40 shrink-0 font-semibold">{label}</dt>
                  <dd className="break-all">
                    {key === 'madeOnDate' || key === 'checkedOnDate'
                      ? formatAuditDateTime(audit[key])
                      : String(audit[key])}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {audit.commandAsJson && (
            <div className="bg-white dark:bg-zinc-900 rounded-md border p-6 shadow">
              <h2 className="text-lg font-semibold mb-3">Command</h2>
              <JsonTreeView raw={audit.commandAsJson} label="Command" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ViewAuditTrail
