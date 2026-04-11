/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useTranslation } from 'react-i18next'

const Settings = () => {
  const { t } = useTranslation('common')
  return (
    <div className="min-h-screen px-4 py-6 bg-gray-50 dark:bg-zinc-900">
      <AppBreadCrumbs
        items={[
          { label: t('nav.home'), href: '/home' },
          { label: t('nav.settings') },
        ]}
      />

      <div className="bg-white p-8 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Accordion
          type="single"
          collapsible
          className="w-full"
          defaultValue="item-1"
        >
          <AccordionItem value="item-1">
            <AccordionTrigger>{t('ui.mainConfiguration')}</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-6">
              <div>
                <label className="text-sm font-medium">
                  {t('ui.defaultLanguage')}
                </label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={t('ui.selectLanguage')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t('languages.en-US')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">
                  {t('ui.defaultDateFormat')}
                </label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={t('ui.selectFormat')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dd MMMM yyyy">dd MMMM yyyy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">
                  {t('ui.decimalsToDisplay')}
                </label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={t('ui.selectDecimals')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Images */}
          <AccordionItem value="item-2">
            <AccordionTrigger>{t('ui.images')}</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-6">
              <div>
                <p className="font-semibold">{t('ui.favicon')}</p>
                <input type="file" />
              </div>
              <div>
                <p className="font-semibold">{t('ui.coverImage')}</p>
                <input type="file" />
              </div>
              <div>
                <p className="font-semibold">{t('ui.logo')}</p>
                <input type="file" />
              </div>
              <div>
                <p className="font-semibold">
                  {t('ui.logoWithOrganizationName')}
                </p>
                <input type="file" />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Theme and Font */}
          <AccordionItem value="item-3">
            <AccordionTrigger>{t('ui.themeAndFont')}</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-6">
              <div>
                <p className="font-semibold">{t('fields.theme')}</p>
                {/* Replace with custom <ThemePicker /> component if needed */}
              </div>
              <div>
                <label className="text-sm font-medium">
                  {t('ui.defaultFont')}
                </label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={t('ui.chooseFont')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inter">Inter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Contact Information */}
          <AccordionItem value="item-4">
            <AccordionTrigger>{t('ui.contactInformation')}</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-6">
              <div>
                <label className="text-sm font-medium">
                  {t('fields.website')}
                </label>
                <Input type="url" />
              </div>
              <div>
                <label className="text-sm font-medium">
                  {t('fields.email')}
                </label>
                <Input type="email" />
              </div>
              <div>
                <label className="text-sm font-medium">
                  {t('fields.contactNo')}
                </label>
                <Input type="tel" />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}

export default Settings
