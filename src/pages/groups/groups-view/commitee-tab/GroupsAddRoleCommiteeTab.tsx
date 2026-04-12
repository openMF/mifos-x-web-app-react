/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import AppSelect from '@/components/custom/select/AppSelect'
import { useTranslation } from 'react-i18next'

const GroupsAddRoleCommitteeTab = () => {
  const navigate = useNavigate()
  const { t } = useTranslation('groups')
  const { t: tc } = useTranslation('common')

  const [form, setForm] = useState({
    clientId: '',
    roleId: '',
  })

  // Basic form validation
  const canSubmit = form.clientId !== '' && form.roleId !== ''

  // Handle submit
  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    navigate(-1)
  }

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: tc('nav.home'), href: '/home' },
          { label: t('title'), href: '/groups' },
          { label: t('addRole.breadcrumbGroup') },
          { label: t('addRole.heading'), current: true },
        ]}
      />

      {/* Card wrapper */}
      <div className="mt-6 bg-white dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-700 shadow p-8 max-w-2xl ml-auto mr-auto">
        <form className="space-y-8" onSubmit={handleConfirm}>
          <h1 className="text-2xl font-semibold">{t('addRole.heading')}</h1>

          {/* Client dropdown */}
          <AppSelect
            selectLabel={t('addRole.labelClient')}
            selectPlaceholder={t('addRole.placeholderClient')}
            selectValue={form.clientId}
            selectOnChange={v => setForm(s => ({ ...s, clientId: v }))}
            selectOptions={[]}
            selectClassname="w-full space-y-2"
          />

          {/* Role dropdown */}
          <AppSelect
            selectLabel={t('addRole.labelRole')}
            selectPlaceholder={t('addRole.placeholderRole')}
            selectValue={form.roleId}
            selectOnChange={v => setForm(s => ({ ...s, roleId: v }))}
            selectOptions={[]}
            selectClassname="w-full space-y-2"
          />

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="min-w-[100px]"
            >
              {tc('actions.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="min-w-[100px] bg-[#1074b9] hover:bg-[#1074c9] text-white disabled:opacity-60"
            >
              {t('addRole.confirm')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GroupsAddRoleCommitteeTab
