/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import AppSelect from '@/components/custom/select/AppSelect'
import { useTranslation } from 'react-i18next'
import { CentersApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  type ExtendedCenterResponse,
  buildCenterUpdatePayload,
} from './center-types'

const centersApi = new CentersApi(getConfiguration())

const EditCenters = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation('centers')
  const { t: tc } = useTranslation('common')

  const [center, setCenter] = useState<ExtendedCenterResponse>()
  const [name, setName] = useState('')
  const [staffId, setStaffId] = useState<string>('')
  const [externalId, setExternalId] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setLoadError(true)
      return
    }
    let ignore = false
    setLoading(true)
    setLoadError(false)
    setCenter(undefined)
    ;(async () => {
      try {
        const res = await centersApi.retrieveOne14(Number(id), true, {
          params: { template: true },
        })
        if (ignore) return
        const centerData = res.data as ExtendedCenterResponse
        setCenter(centerData)
        setName(centerData.name ?? '')
        setExternalId(centerData.externalId ?? '')
        setStaffId(centerData.staffId ? String(centerData.staffId) : '')
      } catch (err) {
        if (ignore) return
        console.error("Can't fetch center", err)
        setLoadError(true)
      } finally {
        if (!ignore) setLoading(false)
      }
    })()

    return () => {
      ignore = true
    }
  }, [id, reloadKey])

  const staffOptions = (center?.staffOptions ?? []).map(s => ({
    id: String(s.id ?? ''),
    name: s.displayName ?? '',
  }))

  const formDisabled = loading || loadError || saving

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || formDisabled || !name.trim()) return

    setSaving(true)
    setError(null)
    try {
      const payload = buildCenterUpdatePayload(name, externalId, staffId)
      await centersApi.update12(Number(id), payload)
      navigate(`/centers/${id}/general`)
    } catch (err) {
      console.error('Failed to update center', err)
      setError(t('edit.errorUpdate'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      <AppBreadCrumbs
        items={[
          { label: tc('nav.home'), href: '/home' },
          { label: t('title'), href: '/centers' },
          { label: center?.name ?? t('title'), href: `/centers/${id}` },
          { label: t('edit.breadcrumb'), current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">{t('edit.heading')}</h2>

        {loadError && (
          <div
            role="alert"
            className="mb-6 flex items-center justify-between gap-4 p-4 rounded-md bg-destructive/15 text-destructive text-sm font-medium"
          >
            <span>{t('errors.failedFetchCenter')}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => setReloadKey(prev => prev + 1)}
            >
              {t('edit.retry')}
            </Button>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-md bg-destructive/15 text-destructive text-sm font-medium"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-6">
            <div className="w-full space-y-2">
              <Label htmlFor="center-name">{t('edit.labelName')}</Label>
              <Input
                id="center-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('edit.placeholderName')}
                className="w-full"
                disabled={formDisabled}
                required
              />
            </div>

            <div className="w-full space-y-2">
              <AppSelect
                key={center?.id ?? 'loading'}
                selectLabel={t('edit.labelStaff')}
                selectValue={staffId}
                selectOnChange={setStaffId}
                selectPlaceholder={t('edit.selectStaff')}
                selectOptions={staffOptions}
                selectClassname="w-full space-y-2"
                disabled={formDisabled}
              />
            </div>

            <div className="w-full space-y-2">
              <Label htmlFor="external-id">{t('edit.labelExternalId')}</Label>
              <Input
                id="external-id"
                value={externalId}
                onChange={e => setExternalId(e.target.value)}
                placeholder={t('edit.placeholderExternalId')}
                className="w-full"
                disabled={formDisabled}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              disabled={saving}
              onClick={() => navigate(`/centers/${id}/general`)}
            >
              {tc('actions.cancel')}
            </Button>

            <Button
              type="submit"
              disabled={formDisabled || !name.trim()}
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white cursor-pointer"
            >
              {saving ? tc('actions.saving') : tc('actions.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditCenters
