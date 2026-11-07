/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { AxiosError } from 'axios'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EntityDataTableApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import { CHECK_ENTITIES, PRODUCT_ENTITIES, type CheckEntity } from './entities'

const entityDataTableApi = new EntityDataTableApi(getConfiguration())

type ApiErrorResponse = {
  defaultUserMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}

type NamedCode = { name?: string; code?: number }
type NamedId = { id?: number; name?: string }

/** The real shape of GET /entityDatatableChecks/template */
type ChecksTemplate = {
  datatables?: Array<{ entity?: string; dataTableName?: string }>
  statusClient?: NamedCode[]
  statusLoans?: NamedCode[]
  statusGroup?: NamedCode[]
  statusSavings?: NamedCode[]
  loanProductDatas?: NamedId[]
  savingsProductDatas?: NamedId[]
}

/** Product select value meaning "no productId": the check covers every product */
const ALL_PRODUCTS = 'all'

/**
 * Creates an entity data table check (POST /entityDatatableChecks), the Create
 * page of the Angular web app. A check makes Fineract refuse a status change
 * (e.g. activating a client) until the chosen data table has an entry.
 */
const CreateEntityDataTableCheck = () => {
  const navigate = useNavigate()
  const { t } = useTranslation(['organization', 'common'])

  const [template, setTemplate] = useState<ChecksTemplate>({})
  const [entity, setEntity] = useState<CheckEntity | ''>('')
  const [status, setStatus] = useState('')
  const [datatableName, setDatatableName] = useState('')
  const [productId, setProductId] = useState(ALL_PRODUCTS)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await entityDataTableApi.getTemplate()
        setTemplate((res.data ?? {}) as ChecksTemplate)
      } catch {
        setError(t('entityChecks.errors.templateFailed'))
      }
    })()
  }, [t])

  const entityConfig = CHECK_ENTITIES.find(e => e.value === entity)
  const statuses = entityConfig ? (template[entityConfig.statusKey] ?? []) : []
  const datatables = (template.datatables ?? []).filter(
    d => d.entity === entity
  )
  const products =
    entity === 'm_loan'
      ? (template.loanProductDatas ?? [])
      : entity === 'm_savings_account'
        ? (template.savingsProductDatas ?? [])
        : []
  const hasProduct = PRODUCT_ENTITIES.includes(entity)

  const handleEntityChange = (value: string) => {
    // Statuses, data tables and products all depend on the entity
    setEntity(value as CheckEntity)
    setStatus('')
    setDatatableName('')
    setProductId(ALL_PRODUCTS)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!entity || !status || !datatableName || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await entityDataTableApi.createEntityDatatableCheck({
        entity,
        status: Number(status),
        datatableName,
        ...(hasProduct && productId !== ALL_PRODUCTS
          ? { productId: Number(productId) }
          : {}),
      })
      navigate('/organization/data-checks')
    } catch (err) {
      const data = (err as AxiosError<ApiErrorResponse>).response?.data
      setError(
        data?.errors?.[0]?.defaultUserMessage ||
          data?.defaultUserMessage ||
          t('entityChecks.errors.createFailed')
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('title'), href: '/organization' },
          {
            label: t('entityDataTableChecks'),
            href: '/organization/data-checks',
          },
          { label: t('common:actions.create'), current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">
          {t('entityChecks.createTitle')}
        </h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="w-full space-y-2">
            <Label htmlFor="entity">
              {t('entityChecks.fields.entityRequired')}
            </Label>
            <Select value={entity} onValueChange={handleEntityChange}>
              <SelectTrigger id="entity" className="w-full">
                <SelectValue
                  placeholder={t('entityChecks.placeholders.selectEntity')}
                />
              </SelectTrigger>
              <SelectContent>
                {CHECK_ENTITIES.map(e => (
                  <SelectItem key={e.value} value={e.value}>
                    {t(e.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full space-y-2">
            <Label htmlFor="status">
              {t('entityChecks.fields.statusRequired')}
            </Label>
            <Select value={status} onValueChange={setStatus} disabled={!entity}>
              <SelectTrigger id="status" className="w-full">
                <SelectValue
                  placeholder={t('entityChecks.placeholders.selectStatus')}
                />
              </SelectTrigger>
              <SelectContent>
                {statuses.map(s => (
                  <SelectItem key={s.code} value={String(s.code)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full space-y-2">
            <Label htmlFor="datatable">
              {t('entityChecks.fields.dataTableRequired')}
            </Label>
            <Select
              value={datatableName}
              onValueChange={setDatatableName}
              disabled={!entity || datatables.length === 0}
            >
              <SelectTrigger id="datatable" className="w-full">
                <SelectValue
                  placeholder={
                    entity && datatables.length === 0
                      ? t('entityChecks.placeholders.noDataTables')
                      : t('entityChecks.placeholders.selectDataTable')
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {datatables.map(d => (
                  <SelectItem
                    key={d.dataTableName}
                    value={d.dataTableName ?? ''}
                  >
                    {d.dataTableName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasProduct && (
            <div className="w-full space-y-2">
              <Label htmlFor="product">
                {t('entityChecks.fields.product')}
              </Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger id="product" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_PRODUCTS}>
                    {t('entityChecks.allProducts')}
                  </SelectItem>
                  {products.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/organization/data-checks')}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button
              type="submit"
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
              disabled={!entity || !status || !datatableName || submitting}
            >
              {t('common:actions.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateEntityDataTableCheck
