/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import AppSelect from '@/components/custom/select/AppSelect'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CurrencyApi, type CurrencyData } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTrigger,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons'

const currenciesApi = new CurrencyApi(getConfiguration())

const ManageCurrencies = () => {
  const [currencies, setCurrencies] = useState<CurrencyData[]>([])
  const [selectedCurrency, setSelectedCurrency] = useState<string>('')
  const [activeCurrencies, setActiveCurrencies] = useState<string[]>([])

  // fetch available and active currencies on mount
  useEffect(() => {
    ;(async () => {
      try {
        const res = await currenciesApi.retrieveCurrencies()
        setCurrencies(res.data?.currencyOptions ?? [])
        // initialize active list from server
        const active = (res.data?.selectedCurrencyOptions ?? [])
          .map(c => c.code ?? '')
          .filter(Boolean)
        setActiveCurrencies(active)
      } catch (err) {
        console.error('Failed to fetch currencies', err)
      }
    })()
  }, [])

  const updateCurrencyConfig = async (updatedList: string[]) => {
    await currenciesApi.updateCurrencies({ currencies: updatedList })
  }

  // add selected currency
  const handleAddCurrency = async () => {
    if (!selectedCurrency || activeCurrencies.includes(selectedCurrency)) return
    const prev = [...activeCurrencies]
    const updated = [...activeCurrencies, selectedCurrency]
    setActiveCurrencies(updated)
    try {
      await updateCurrencyConfig(updated)
    } catch (e) {
      setActiveCurrencies(prev)
      console.error('Failed to add currency', e)
    }
  }

  // delete selected currency
  const handleDeleteCurrency = async (code: string) => {
    const prev = [...activeCurrencies]
    const updated = activeCurrencies.filter(c => c !== code)
    setActiveCurrencies(updated)
    try {
      await updateCurrencyConfig(updated)
    } catch (e) {
      setActiveCurrencies(prev)
      console.error('Failed to delete currency', e)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', href: '/organization' },
          { label: 'Currency Configuration', href: '/organization/currencies' },
          { label: 'Manage Currencies', current: true },
        ]}
      />

      <h2 className="text-2xl font-semibold mb-6">Manage Currencies</h2>

      {/* currency select + add button */}
      <div className="bg-white dark:bg-zinc-900 rounded-md border p-4 mb-6 flex items-center gap-4">
        <div className="flex-1">
          <AppSelect
            selectLabel="Currency*"
            selectValue={selectedCurrency}
            selectOnChange={val => setSelectedCurrency(val)}
            selectPlaceholder="Select Currency"
            selectOptions={currencies.map(c => ({
              id: c.code ?? '',
              name: c.name ?? c.code ?? 'Unknown',
            }))}
          />
        </div>
        <Button
          onClick={handleAddCurrency}
          className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
          disabled={
            !selectedCurrency || activeCurrencies.includes(selectedCurrency)
          }
        >
          <Plus />
        </Button>
      </div>

      {/* active currencies list with delete confirmation */}
      <div className="bg-white dark:bg-zinc-900 rounded-md border">
        <div className="grid grid-cols-2 gap-4 p-4">
          {activeCurrencies.map(code => (
            <div key={code} className="flex items-center gap-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="bg-red-600 hover:bg-red-700 text-white">
                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Currency</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete <strong>{code}</strong>?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="cursor-pointer">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                      onClick={() => handleDeleteCurrency(code)}
                    >
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <span className="font-medium">{code}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ManageCurrencies
