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
import AppMultiSelect from '@/components/custom/select/AppMultiSelect'
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
import { LoanProductsApi, ProductMixApi } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const loanProductsApi = new LoanProductsApi(getConfiguration())
const productMixApi = new ProductMixApi(getConfiguration())

type ApiErrorResponse = {
  defaultUserMessage?: string
  errors?: Array<{ defaultUserMessage?: string }>
}

type ProductOption = { id?: number; name?: string }

/**
 * The real shape of both product mix templates:
 * GET /loanproducts/template?isProductMixTemplate=true and
 * GET /loanproducts/{productId}/productmix?template=true
 */
type ProductMixTemplate = {
  productOptions?: ProductOption[]
  restrictedProducts?: ProductOption[]
  allowedProducts?: ProductOption[]
}

/**
 * Creates a product mix (POST /loanproducts/{productId}/productmix), the
 * Create page of the Angular web app. A product mix lists the loan products a
 * client may not hold at the same time as a loan of the chosen product.
 */
const CreateProductMix = () => {
  const navigate = useNavigate()
  const { t } = useTranslation(['products', 'common'])

  const [productOptions, setProductOptions] = useState<ProductOption[]>([])
  const [restrictedOptions, setRestrictedOptions] = useState<ProductOption[]>(
    []
  )
  const [productId, setProductId] = useState('')
  const [restrictedProducts, setRestrictedProducts] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        // Only lists loan products that do not have a product mix yet
        const res = await loanProductsApi.retrieveTemplate11(true)
        const template = res.data as unknown as ProductMixTemplate
        setProductOptions(template.productOptions ?? [])
      } catch {
        setError(t('productMix.errors.templateFailed'))
      }
    })()
  }, [t])

  useEffect(() => {
    if (!productId) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await productMixApi.retrieveTemplate12(Number(productId), {
          params: { template: true },
        })
        if (cancelled) return
        const template = res.data as unknown as ProductMixTemplate
        // Products already restricted against this one, e.g. through another
        // product's mix. Fineract replaces the restrictions with the ones sent,
        // so they start selected, as in the Angular app, to avoid removing them
        const restricted = template.restrictedProducts ?? []
        // A product cannot be restricted against itself
        const allowed = (template.allowedProducts ?? []).filter(
          p => String(p.id) !== productId
        )
        setRestrictedOptions([...restricted, ...allowed])
        setRestrictedProducts(restricted.map(p => String(p.id)))
      } catch {
        if (!cancelled) setError(t('productMix.errors.restrictionsFailed'))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [productId, t])

  const handleProductChange = (value: string) => {
    // The restriction options depend on the chosen product
    setProductId(value)
    setRestrictedOptions([])
    setRestrictedProducts([])
    setError(null)
  }

  const canSubmit = !!productId && restrictedProducts.length > 0 && !submitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await productMixApi.createProductMix(Number(productId), {
        restrictedProducts: restrictedProducts.map(Number),
      })
      const state: RouteSuccessState = {
        successMessage: t('productMix.created'),
      }
      navigate('/products/products-mix', { state })
    } catch (err) {
      const data = (err as AxiosError<ApiErrorResponse>).response?.data
      setError(
        data?.errors?.[0]?.defaultUserMessage ||
          data?.defaultUserMessage ||
          t('productMix.errors.createFailed')
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
          { label: t('title'), href: '/products' },
          { label: t('productsMix'), href: '/products/products-mix' },
          { label: t('common:actions.create'), current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">
          {t('productMix.createTitle')}
        </h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="w-full space-y-2">
            <Label htmlFor="product">
              {t('productMix.fields.productRequired')}
            </Label>
            <Select
              value={productId}
              onValueChange={handleProductChange}
              disabled={productOptions.length === 0}
            >
              <SelectTrigger id="product" className="w-full">
                <SelectValue
                  placeholder={
                    productOptions.length === 0
                      ? t('productMix.placeholders.noProducts')
                      : t('productMix.placeholders.selectProduct')
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {productOptions.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <AppMultiSelect
            selectLabel={t('productMix.fields.restrictedProductsRequired')}
            selectValues={restrictedProducts}
            selectOnChange={setRestrictedProducts}
            selectPlaceholder={
              productId && restrictedOptions.length === 0
                ? t('productMix.placeholders.noRestrictedProducts')
                : t('productMix.placeholders.selectRestrictedProducts')
            }
            selectOptions={restrictedOptions.map(p => ({
              id: p.id ?? '',
              name: p.name ?? '',
            }))}
            selectClassname="w-full space-y-2"
          />

          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/products/products-mix')}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button
              type="submit"
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
              disabled={!canSubmit}
            >
              {t('common:actions.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateProductMix
