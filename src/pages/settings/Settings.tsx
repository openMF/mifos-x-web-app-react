/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { LanguageSwitcher } from '@/components/custom/language-switcher/LanguageSwitcher'
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
    <div className="min-h-screen px-4 py-8 bg-gray-50 dark:bg-zinc-950">
      <div className="max-w-4xl mx-auto">
        <AppBreadCrumbs
          items={[
            { label: t('nav.home'), href: '/home' },
            { label: t('nav.settings') },
          ]}
        />

        <div className="mt-6 bg-white p-6 md:p-8 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <Accordion
            type="single"
            collapsible
            className="w-full"
            defaultValue="item-1"
          >
            {/* --- Main Configuration --- */}
            <AccordionItem value="item-1" className="border-b-0">
              <AccordionTrigger className="hover:no-underline text-lg font-semibold cursor-pointer">
                {t('ui.mainConfiguration')}
              </AccordionTrigger>
              <AccordionContent>
                <div className="mt-4 flex flex-col gap-6 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800 max-w-2xl">
                  <div className="space-y-2">
                    <label
                      htmlFor="default-language"
                      className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      {t('ui.defaultLanguage')}
                    </label>
                    <LanguageSwitcher
                      id="default-language"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="default-date-format"
                      className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      {t('ui.defaultDateFormat')}
                    </label>
                    <Select>
                      <SelectTrigger
                        id="default-date-format"
                        className="w-full"
                      >
                        <SelectValue placeholder={t('ui.selectFormat')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dd MMMM yyyy">
                          dd MMMM yyyy
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="decimals-to-display"
                      className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      {t('ui.decimalsToDisplay')}
                    </label>
                    <Select>
                      <SelectTrigger
                        id="decimals-to-display"
                        className="w-full"
                      >
                        <SelectValue placeholder={t('ui.selectDecimals')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* --- Images --- */}
            <AccordionItem value="item-2" className="border-b-0">
              <AccordionTrigger className="hover:no-underline text-lg font-semibold cursor-pointer">
                {t('ui.images')}
              </AccordionTrigger>
              <AccordionContent>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
                  {[
                    { label: t('ui.favicon'), id: 'favicon' },
                    { label: t('ui.coverImage'), id: 'cover' },
                    { label: t('ui.logo'), id: 'logo' },
                    { label: t('ui.logoWithOrganizationName'), id: 'logo-org' },
                  ].map(field => (
                    <div key={field.id} className="space-y-2">
                      <label
                        htmlFor={field.id}
                        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                      >
                        {field.label}
                      </label>
                      <div className="flex items-center justify-center w-full h-24 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        <input
                          type="file"
                          id={field.id}
                          className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* --- Theme and Font --- */}
            <AccordionItem value="item-3" className="border-b-0">
              <AccordionTrigger className="hover:no-underline text-lg font-semibold cursor-pointer">
                {t('ui.themeAndFont')}
              </AccordionTrigger>
              <AccordionContent>
                <div className="mt-4 flex flex-col gap-6 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800 max-w-2xl">
                  <div>
                    <p className="font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                      {t('fields.theme')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="default-font"
                      className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      {t('ui.defaultFont')}
                    </label>
                    <Select>
                      <SelectTrigger id="default-font" className="w-full">
                        <SelectValue placeholder={t('ui.chooseFont')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inter">Inter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* --- Contact Information --- */}
            <AccordionItem value="item-4" className="border-b-0">
              <AccordionTrigger className="hover:no-underline text-lg font-semibold cursor-pointer">
                {t('ui.contactInformation')}
              </AccordionTrigger>
              <AccordionContent>
                <div className="mt-4 flex flex-col gap-6 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800 max-w-2xl">
                  <div className="space-y-2">
                    <label
                      htmlFor="contact-website"
                      className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      {t('fields.website')}
                    </label>
                    <Input id="contact-website" type="url" className="w-full" />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="contact-email"
                      className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      {t('fields.email')}
                    </label>
                    <Input id="contact-email" type="email" className="w-full" />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="contact-number"
                      className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      {t('fields.contactNo')}
                    </label>
                    <Input id="contact-number" type="tel" className="w-full" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  )
}

export default Settings
