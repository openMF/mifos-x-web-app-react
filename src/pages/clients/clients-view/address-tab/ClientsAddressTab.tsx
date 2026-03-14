/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
// import { useParams } from "react-router-dom";
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

const ClientsAddressTab = () => {
  // const { id } = useParams();

  // modal open/close
  const [open, setOpen] = useState(false)
  const { t } = useTranslation('clients')
  const { t: tc } = useTranslation('common')

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

  const onChange = (key: keyof typeof form) => (e: any) =>
    setForm(f => ({ ...f, [key]: e?.target ? e.target.value : e }))

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
                    <SelectValue placeholder={t('address.selectTypePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOME">{t('address.typeHome')}</SelectItem>
                    <SelectItem value="WORK">{t('address.typeWork')}</SelectItem>
                    <SelectItem value="OTHER">{t('address.typeOther')}</SelectItem>
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
    </div>
  )
}

export default ClientsAddressTab
