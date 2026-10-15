/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ClientsAddressApi, type AddressData } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// Built per call so it picks up the current credentials; see EntityDocumentsTab.
const addressApi = () => new ClientsAddressApi(getConfiguration())

/** Joins the parts of an address that are filled in, skipping empty ones. */
const joinParts = (parts: (string | undefined)[]) =>
  parts.filter(part => part && part.trim()).join(', ')

const ClientsAddressTab = () => {
  const { id } = useParams()

  // modal open/close
  const [open, setOpen] = useState(false)
  const { t } = useTranslation('clients')
  const { t: tc } = useTranslation('common')

  const [addresses, setAddresses] = useState<AddressData[]>([])
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)

  /** Identifies the newest request, so a response for a previous client is discarded. */
  const loadIdRef = useRef(0)

  useEffect(() => {
    const requestId = ++loadIdRef.current
    if (!id) {
      setAddresses([])
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadFailed(false)
    addressApi()
      .getAddresses1(Number(id))
      .then(res => {
        if (requestId === loadIdRef.current) setAddresses(res?.data ?? [])
      })
      .catch(e => {
        if (requestId !== loadIdRef.current) return
        console.error('Failed to load client addresses', e)
        setAddresses([])
        setLoadFailed(true)
      })
      .finally(() => {
        if (requestId === loadIdRef.current) setLoading(false)
      })
  }, [id])

  const [form, setForm] = useState({
    addressType: '',
    addressLine1: '',
    addressLine2: '',
    addressLine3: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  })

  useEffect(() => {
    setOpen(false)
  }, [])

  const onChange =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement> | string) =>
      setForm(f => ({
        ...f,
        [key]: typeof e === 'string' ? e : e.target.value,
      }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setOpen(false)
  }

  return (
    <div className="bg-transparent">
      {/* header + Add button */}
      <div className="flex items-center justify-between p-4">
        <h3 className="text-lg font-semibold text-black dark:text-white">
          {t('address.heading')}
        </h3>

        {/* add address dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0e77b7] hover:bg-[#0662a3] text-white rounded-md border-0 shadow-none">
              <Plus className="mr-1" /> {t('address.addButton')}
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>{t('address.dialogTitle')}</DialogTitle>
            </DialogHeader>

            {/* form body */}
            <form onSubmit={onSubmit} className="space-y-4">
              {/* address type */}
              <div className="space-y-2">
                <Label>{t('address.labelAddressType')}</Label>
                <Select
                  value={form.addressType}
                  onValueChange={v => setForm(f => ({ ...f, addressType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t('address.selectTypePlaceholder')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOME">
                      {t('address.typeHome')}
                    </SelectItem>
                    <SelectItem value="WORK">
                      {t('address.typeWork')}
                    </SelectItem>
                    <SelectItem value="OTHER">
                      {t('address.typeOther')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* lines 1–3 */}
              <div className="space-y-2">
                <Label>{t('address.labelAddressLine1')}</Label>
                <Input
                  value={form.addressLine1}
                  onChange={onChange('addressLine1')}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('address.labelAddressLine2')}</Label>
                <Input
                  value={form.addressLine2}
                  onChange={onChange('addressLine2')}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('address.labelAddressLine3')}</Label>
                <Input
                  value={form.addressLine3}
                  onChange={onChange('addressLine3')}
                />
              </div>

              {/* city */}
              <div className="space-y-2">
                <Label>{t('address.labelCity')}</Label>
                <Input value={form.city} onChange={onChange('city')} />
              </div>

              {/* state/province*/}
              <div className="space-y-2 w-full">
                <Label>{t('address.labelState')}</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={t('address.labelState')} />
                  </SelectTrigger>
                  <SelectContent className="w-full"></SelectContent>
                </Select>
              </div>

              {/* postal code */}
              <div className="space-y-2">
                <Label>{t('address.labelPostalCode')}</Label>
                <Input value={form.city} onChange={onChange('city')} />
              </div>

              {/* country */}
              <div className="space-y-2">
                <Label>{t('address.labelCountry')}</Label>
                <Input value={form.city} onChange={onChange('city')} />
              </div>

              {/* actions */}
              <DialogFooter className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  {tc('actions.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="bg-[#0e77b7] hover:bg-[#0662a3] text-white"
                >
                  {t('address.addButton')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* address list */}
      <div className="px-4 pb-4">
        {loading ? (
          <p className="text-sm text-zinc-500">{t('address.loading')}</p>
        ) : loadFailed ? (
          <p className="text-sm text-red-600">{t('address.loadFailed')}</p>
        ) : addresses.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {t('address.empty')}
          </p>
        ) : (
          <div className="space-y-3">
            {addresses.map((address, index) => (
              <div
                key={address.addressId ?? index}
                className="rounded-md border border-gray-200 p-4 text-black dark:border-gray-700 dark:text-white"
              >
                <div className="mb-1 flex items-center justify-between gap-4">
                  <span className="font-medium">
                    {address.addressType || '—'}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {address.isActive === false
                      ? t('address.statusInactive')
                      : t('address.statusActive')}
                  </span>
                </div>
                <p className="text-sm">
                  {joinParts([
                    address.addressLine1,
                    address.addressLine2,
                    address.addressLine3,
                  ]) || '—'}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  {joinParts([
                    address.city,
                    address.stateName,
                    address.postalCode,
                    address.countryName,
                  ])}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ClientsAddressTab
