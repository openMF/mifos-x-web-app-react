/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import type { AxiosError } from 'axios'

import type { RouteSuccessState } from '@/components/custom/route-success-message/RouteSuccessMessage'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import fineract from '@/lib/axios'

type CenterApiErrorResponse = {
  defaultUserMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}

type StaffOption = {
  id: number
  displayName: string
}

type CenterData = {
  id?: number
  name?: string
  officeId?: number
  officeName?: string
  staffOptions?: Array<{
    id?: number
    displayName?: string
    name?: string
    firstname?: string
    lastname?: string
  }>
}

/**
 * Assigns a staff member to an existing center, matching the Angular Mifos X WebApp UI.
 */
const CenterAssignStaff = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation('centers')
  const { t: tc } = useTranslation('common')

  const centerId = Number(id)
  const isValidId = !Number.isNaN(centerId) && centerId > 0

  const [center, setCenter] = useState<CenterData>()
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([])
  const [loadingStaff, setLoadingStaff] = useState(true)
  const [staffId, setStaffId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchCenterAndStaff = async () => {
      if (!isValidId) {
        setError(t('assignStaff.errors.failedFetchCenter'))
        setLoadingStaff(false)
        return
      }

      try {
        setLoadingStaff(true)
        let loadedCenter: CenterData | undefined
        let rawOptions: Array<{
          id?: number
          displayName?: string
          name?: string
          firstname?: string
          lastname?: string
        }> = []

        // 1. Primary: GET /centers/{id}?template=true&staffInSelectedOfficeOnly=true
        try {
          const res = await fineract.get<CenterData>(`/centers/${centerId}`, {
            params: { template: 'true', staffInSelectedOfficeOnly: 'true' },
          })
          if (res?.data) {
            loadedCenter = res.data
            if (
              Array.isArray(res.data.staffOptions) &&
              res.data.staffOptions.length > 0
            ) {
              rawOptions = res.data.staffOptions
            }
          }
        } catch (e) {
          console.warn('GET /centers/{id}?template=true failed', e)
        }

        // 2. Angular resolver pattern: GET /groups/{id}?groupOrCenter=centers&staffInSelectedOfficeOnly=true&template=true
        if (rawOptions.length === 0) {
          try {
            const gRes = await fineract.get<CenterData>(`/groups/${centerId}`, {
              params: {
                groupOrCenter: 'centers',
                template: 'true',
                staffInSelectedOfficeOnly: 'true',
              },
            })
            if (gRes?.data) {
              if (!loadedCenter) loadedCenter = gRes.data
              if (
                Array.isArray(gRes.data.staffOptions) &&
                gRes.data.staffOptions.length > 0
              ) {
                rawOptions = gRes.data.staffOptions
              }
            }
          } catch (e) {
            console.warn('GET /groups/{id}?groupOrCenter=centers failed', e)
          }
        }

        // 3. Fallback: GET /centers/{id}?template=true&staffInSelectedOfficeOnly=false
        if (rawOptions.length === 0) {
          try {
            const resAllOffice = await fineract.get<CenterData>(
              `/centers/${centerId}`,
              {
                params: {
                  template: 'true',
                  staffInSelectedOfficeOnly: 'false',
                },
              }
            )
            if (
              Array.isArray(resAllOffice?.data?.staffOptions) &&
              resAllOffice.data.staffOptions.length > 0
            ) {
              rawOptions = resAllOffice.data.staffOptions
            }
          } catch (e) {
            console.warn(
              'GET /centers/{id} without office restriction failed',
              e
            )
          }
        }

        // 4. Fallback: GET /centers/template
        if (rawOptions.length === 0) {
          try {
            const tmplRes = await fineract.get<CenterData>(
              '/centers/template',
              {
                params: loadedCenter?.officeId
                  ? { officeId: loadedCenter.officeId }
                  : undefined,
              }
            )
            if (
              Array.isArray(tmplRes?.data?.staffOptions) &&
              tmplRes.data.staffOptions.length > 0
            ) {
              rawOptions = tmplRes.data.staffOptions
            }
          } catch (e) {
            console.warn('GET /centers/template failed', e)
          }
        }

        // 5. Fallback: Staff API for office
        if (rawOptions.length === 0 && loadedCenter?.officeId) {
          try {
            const staffRes = await fineract.get<
              Array<{ id?: number; displayName?: string }>
            >('/staff', {
              params: { officeId: loadedCenter.officeId },
            })
            if (Array.isArray(staffRes.data) && staffRes.data.length > 0) {
              rawOptions = staffRes.data
            }
          } catch (e) {
            console.warn('GET /staff with officeId failed', e)
          }
        }

        // Ensure center details (name, etc.) are loaded for breadcrumbs
        if (!loadedCenter?.name) {
          try {
            const cRes = await fineract.get<CenterData>(`/centers/${centerId}`)
            loadedCenter = cRes.data
          } catch (e) {
            console.warn('GET /centers/{id} details failed', e)
          }
        }

        if (!loadedCenter) {
          throw new Error('Center could not be loaded')
        }

        setCenter(loadedCenter)

        const normalized: StaffOption[] = rawOptions
          .map(opt => {
            const sId = opt?.id
            const sName =
              opt?.displayName ||
              opt?.name ||
              [opt?.firstname, opt?.lastname].filter(Boolean).join(' ') ||
              (sId ? `Staff #${sId}` : '')
            return { id: Number(sId), displayName: sName }
          })
          .filter((opt): opt is StaffOption =>
            Boolean(opt.id && opt.displayName)
          )

        setStaffOptions(normalized)
      } catch (err) {
        console.error('Failed to fetch center and staff options', err)
        setError(t('assignStaff.errors.failedFetchCenter'))
      } finally {
        setLoadingStaff(false)
      }
    }

    fetchCenterAndStaff()
  }, [centerId, isValidId, t])

  const backToCenter = () => navigate(`/centers/${id}/general`)

  const validate = (): string | null => {
    if (!isValidId) return t('assignStaff.errors.failedFetchCenter')
    if (!staffId) return t('assignStaff.errors.staffRequired')
    return null
  }

  const onSubmit = async () => {
    const message = validate()
    if (message) {
      setError(message)
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const payload = { staffId: Number(staffId) }
      // Fineract handles center staff assignment through the groups resource
      await fineract.post(`/groups/${centerId}?command=assignStaff`, payload)

      const state: RouteSuccessState = {
        successMessage: t('success.staffAssigned'),
      }
      navigate(`/centers/${id}/general`, { state })
    } catch (err) {
      const data = (err as AxiosError<CenterApiErrorResponse>).response?.data
      setError(
        data?.errors?.[0]?.defaultUserMessage ||
          data?.defaultUserMessage ||
          t('assignStaff.errors.failedAssignStaff')
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-8 max-w-7xl mx-auto">
      {/* Top Header matching Angular layout with vertical blue bar and breadcrumbs */}
      <div className="flex items-start gap-3 mb-8">
        <div className="w-1 self-stretch bg-[#0e77b7] rounded-sm min-h-[44px]" />
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {t('assignStaff.title')}
          </h1>
          <div className="flex items-center text-sm mt-1 text-zinc-500">
            <Link
              to="/centers"
              className="text-[#0e77b7] hover:underline font-medium"
            >
              {t('title')}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-zinc-400" />
            <Link
              to={`/centers/${id}/general`}
              className="text-[#0e77b7] hover:underline font-medium"
            >
              {center?.name || '...'}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-zinc-400" />
            <span className="text-zinc-500">{t('assignStaff.title')}</span>
          </div>
        </div>
      </div>

      {/* Centered Form Card matching Angular mat-card layout */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-6 sm:p-8">
          <form
            onSubmit={e => {
              e.preventDefault()
              onSubmit()
            }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="staff" className="text-sm font-medium">
                {t('assignStaff.labelStaff')}
              </Label>
              <Select
                value={staffId}
                disabled={loadingStaff || staffOptions.length === 0}
                onValueChange={val => {
                  setStaffId(val)
                  setError(null)
                }}
              >
                <SelectTrigger
                  id="staff"
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                >
                  <SelectValue
                    placeholder={
                      loadingStaff
                        ? t('assignStaff.loadingStaff')
                        : staffOptions.length === 0
                          ? t('assignStaff.noStaffFound')
                          : t('assignStaff.selectStaff')
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {staffOptions.map(staff => (
                    <SelectItem key={staff.id} value={String(staff.id)}>
                      {staff.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
                {error}
              </div>
            )}

            {!loadingStaff && !error && staffOptions.length === 0 && (
              <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
                {t('assignStaff.noStaffAvailable')}
              </div>
            )}

            {/* Actions: Centered Cancel and Confirm buttons matching Angular layout */}
            <div className="flex justify-center items-center gap-4 pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={backToCenter}
                disabled={submitting}
                className="px-6"
              >
                {tc('actions.cancel')}
              </Button>
              <Button
                type="submit"
                className="bg-[#0e77b7] hover:bg-[#0662a3] text-white px-6"
                disabled={!staffId || submitting || staffOptions.length === 0}
              >
                {t('assignStaff.confirm')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CenterAssignStaff
