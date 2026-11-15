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
import AppSelect from '@/components/custom/select/AppSelect'
import { Button } from '@/components/ui/button'
import {
  MappingFinancialActivitiesToAccountsApi,
  type FinancialActivityAccountData,
  type FinancialActivityData,
  type GetFinancialActivityAccountsResponse,
  type GLAccountData,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const financialActivityApi = new MappingFinancialActivitiesToAccountsApi(
  getConfiguration()
)

type FinancialActivityMappingEditData = GetFinancialActivityAccountsResponse &
  FinancialActivityAccountData

const hasMappingTemplateData = (
  data: GetFinancialActivityAccountsResponse
): data is FinancialActivityMappingEditData =>
  'financialActivityOptions' in data &&
  Array.isArray(data.financialActivityOptions) &&
  'glAccountOptions' in data &&
  typeof data.glAccountOptions === 'object' &&
  data.glAccountOptions !== null

const getGLAccountOptions = (
  financialActivityId: number | undefined,
  glAccountOptions?: FinancialActivityAccountData['glAccountOptions']
): GLAccountData[] => {
  switch (financialActivityId) {
    case 100:
    case 101:
    case 102:
    case 103:
      return glAccountOptions?.assetAccountOptions ?? []
    case 200:
    case 201:
      return glAccountOptions?.liabilityAccountOptions ?? []
    case 300:
      return glAccountOptions?.equityAccountOptions ?? []
    default:
      return []
  }
}

const EditFinancialActivityMappings = () => {
  const navigate = useNavigate()
  const { id } = useParams()

  const [mapping, setMapping] = useState<FinancialActivityMappingEditData>()
  const [glList, setGlList] = useState<GLAccountData[]>([])
  const [formData, setFormData] = useState({
    financialActivityId: '',
    glAccountId: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')

  const toTitle = (value?: string) =>
    (value || '')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, character => character.toUpperCase())

  useEffect(() => {
    let ignore = false

    const fetchMapping = async () => {
      setIsLoading(true)
      setLoadError('')
      setSubmitError('')

      if (!id || !Number.isFinite(Number(id))) {
        if (!ignore) {
          setLoadError('Invalid financial activity mapping ID.')
          setIsLoading(false)
        }
        return
      }

      try {
        const response = await financialActivityApi.retreive(Number(id), {
          params: { template: true },
        })
        if (!hasMappingTemplateData(response.data)) {
          throw new Error(
            'Financial activity mapping template data is missing.'
          )
        }
        if (ignore) return

        const mappingData = response.data
        const financialActivity = mappingData.financialActivityData

        setMapping(mappingData)
        setFormData({
          financialActivityId: String(financialActivity?.id ?? ''),
          glAccountId: String(mappingData.glAccountData?.id ?? ''),
        })
        setGlList(
          getGLAccountOptions(
            financialActivity?.id,
            mappingData.glAccountOptions
          )
        )
      } catch (err) {
        if (!ignore) {
          console.error('Failed to fetch financial activity mapping', err)
          setLoadError('Failed to load financial activity mapping.')
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    fetchMapping()

    return () => {
      ignore = true
    }
  }, [id])

  const handleFinancialActivityChange = (value: string) => {
    setFormData(previous => ({
      ...previous,
      financialActivityId: value,
      glAccountId: '',
    }))

    const financialActivity = mapping?.financialActivityOptions?.find(
      (option: FinancialActivityData) => String(option.id) === value
    )
    setGlList(
      getGLAccountOptions(financialActivity?.id, mapping?.glAccountOptions)
    )
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitError('')

    if (!formData.financialActivityId || !formData.glAccountId) {
      setSubmitError('Select both a financial activity and a GL account.')
      return
    }

    if (!id || !Number.isFinite(Number(id))) {
      setSubmitError('Invalid financial activity mapping ID.')
      return
    }

    setIsSaving(true)
    try {
      const response = await financialActivityApi.updateGLAccount(Number(id), {
        financialActivityId: Number(formData.financialActivityId),
        glAccountId: Number(formData.glAccountId),
      })
      navigate(
        `/accounting/financial-activity-mappings/${response.data.resourceId ?? id}`
      )
    } catch (err) {
      console.error('Failed to update financial activity mapping', err)
      setSubmitError('Failed to update financial activity mapping.')
    } finally {
      setIsSaving(false)
    }
  }

  const financialActivityOptions = (mapping?.financialActivityOptions ?? [])
    .filter(
      (
        option
      ): option is FinancialActivityData & { id: number; name: string } =>
        option.id !== undefined && option.name !== undefined
    )
    .map(option => ({
      id: String(option.id),
      name: `(${option.id}) ${toTitle(option.name)}`,
    }))

  const glAccountOptions = glList
    .filter(
      (account): account is GLAccountData & { id: number; name: string } =>
        account.id !== undefined && account.name !== undefined
    )
    .map(account => ({
      id: String(account.id),
      name: account.glCode
        ? `(${account.glCode}) ${account.name}`
        : account.name,
    }))

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Accounting', href: '/accounting' },
          {
            label: 'Financial Activity Mappings',
            href: '/accounting/financial-activity-mappings',
          },
          {
            label: `${mapping?.id ?? id}`,
            href: `/accounting/financial-activity-mappings/${id}`,
          },
          { label: 'Edit', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">
          Edit Financial Activity Mapping
        </h2>

        {isLoading || (!loadError && mapping?.id !== Number(id)) ? (
          <p>Loading financial activity mapping...</p>
        ) : loadError ? (
          <div className="space-y-4">
            <p role="alert" className="text-red-600">
              {loadError}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate(`/accounting/financial-activity-mappings/${id}`)
              }
            >
              Back
            </Button>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            {submitError && (
              <p role="alert" className="text-red-600">
                {submitError}
              </p>
            )}

            <AppSelect
              selectLabel="Financial Activity*"
              selectPlaceholder="Select Financial Activity"
              selectValue={formData.financialActivityId}
              selectOnChange={handleFinancialActivityChange}
              selectOptions={financialActivityOptions}
              selectClassname="w-full space-y-2"
            />

            <AppSelect
              selectLabel="GL Account*"
              selectPlaceholder="Select GL Account"
              selectValue={formData.glAccountId}
              selectOnChange={value =>
                setFormData(previous => ({ ...previous, glAccountId: value }))
              }
              selectOptions={glAccountOptions}
              selectClassname="w-full space-y-2"
            />

            <div className="flex justify-center gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  navigate(`/accounting/financial-activity-mappings/${id}`)
                }
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
              >
                {isSaving ? 'Saving...' : 'Submit'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default EditFinancialActivityMappings
