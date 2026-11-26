/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState, type ReactNode } from 'react'
import { useSelector } from 'react-redux'
import { Trans, useTranslation } from 'react-i18next'
import axios from 'axios'

import type { RootState } from '@/app/store'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import fineract, { getServerUrl } from '@/lib/axios'
import { currentBusinessDate } from '@/lib/business-date'
import { formatDate } from '@/lib/date-utils'
import { envConfig } from '@/lib/env-config'
import { getAuthToken, getOidcToken } from '@/lib/http-client'

type Version = { version: string; hash: string }

type User = { username: string; name: string }

/**
 * Fineract version and commit hash from the actuator info endpoint, which is
 * outside /api. The version is kept whole, since splitting "1.16.0-SNAPSHOT"
 * on "-" would show "SNAPSHOT" as the hash.
 */
const fetchFineractVersion = async (): Promise<Version> => {
  try {
    const res = await axios.get(
      `${getServerUrl()}/fineract-provider/actuator/info`
    )
    const git = res.data?.git
    const commit = git?.commit?.id
    return {
      version: git?.build?.version ?? '',
      hash: commit?.abbrev ?? (typeof commit === 'string' ? commit : ''),
    }
  } catch (e) {
    console.error('actuator info failed', e)
    return { version: '', hash: '' }
  }
}

/**
 * The signed-in user. The login response is only kept in the store until the
 * page reloads, so after that the username comes from the stored Basic auth
 * credential, or from /userdetails for an OIDC session.
 */
const fetchUser = async (
  login: Record<string, unknown> | null
): Promise<User> => {
  let details = login
  if (!details && getOidcToken()) {
    try {
      details = (await fineract.get('v1/userdetails')).data
    } catch (e) {
      console.error('userdetails failed', e)
    }
  }
  const token = getAuthToken()
  const username =
    (details?.username as string | undefined) ??
    (token ? atob(token).split(':')[0] : '')
  const staffName = details?.staffDisplayName as string | undefined
  return { username, name: staffName || username }
}

const linkProps = { target: '_blank', rel: 'noopener noreferrer' }

const LICENSING_LINKS = {
  fineractLink: 'https://fineract.apache.org/',
  apacheLicenseLink: 'https://www.apache.org/licenses/LICENSE-2.0',
  mplLink: 'https://www.mozilla.org/en-US/MPL/2.0/',
  licenseCodeLink:
    'https://mifosforge.jira.com/wiki/spaces/RES/pages/174456833/How+to+properly+license+Mifos+code+that+you+are+contributing',
  contributorAgreementLink:
    'https://mifos.org/resources/community/contributor-agreement/',
  licenseFaqLink: 'https://www.apache.org/foundation/license-faq.html',
  externalSoftwareLink:
    'https://mifosforge.jira.com/wiki/spaces/RES/pages/174456843/Adding+External+Software+to+Mifos',
  codeOfConductLink: 'https://mifos.org/resources/community/code-of-conduct/',
}

const licensingComponents = Object.fromEntries(
  Object.entries(LICENSING_LINKS).map(([name, href]) => [
    name,
    <a href={href} {...linkProps} className="text-[#1074b9] underline" />,
  ])
)

const Hash = ({ value }: { value: string }) =>
  value ? (
    <span className="ml-2 font-mono text-xs text-zinc-500 dark:text-zinc-400">
      {value}
    </span>
  ) : null

/** System Information, as in the Angular web app */
const SystemInformation = () => {
  const { t, i18n } = useTranslation(['organization', 'common'])
  const login = useSelector((state: RootState) => state.auth.user)
  const [fineractVersion, setFineractVersion] = useState<Version | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [businessDate, setBusinessDate] = useState<string | null>(null)
  const [renderTime] = useState(() => new Date())

  useEffect(() => {
    fetchFineractVersion().then(setFineractVersion)
    currentBusinessDate()
      .then(setBusinessDate)
      .catch(e => console.error('business date failed', e))
  }, [])

  useEffect(() => {
    fetchUser(login).then(setUser)
  }, [login])

  const rows: [string, ReactNode][] = [
    [
      t('systemInformation.fields.tenant'),
      localStorage.getItem('mifosTenant') || envConfig.tenantId,
    ],
    [
      t('systemInformation.fields.webApp'),
      <>
        {__APP_VERSION__}
        <Hash value={__APP_HASH__} />
      </>,
    ],
    [
      t('systemInformation.fields.fineract'),
      <>
        {fineractVersion?.version}
        <Hash value={fineractVersion?.hash ?? ''} />
      </>,
    ],
    [t('systemInformation.fields.server'), getServerUrl()],
    [t('systemInformation.fields.username'), user?.username],
    [t('systemInformation.fields.name'), user?.name],
  ]
  if (businessDate) {
    rows.push([
      t('systemInformation.fields.businessDate'),
      formatDate(businessDate.split('-').map(Number), i18n.language),
    ])
  }
  rows.push([
    t('systemInformation.fields.renderTime'),
    new Intl.DateTimeFormat(i18n.language, {
      dateStyle: 'long',
      timeStyle: 'medium',
    }).format(renderTime),
  ])

  const licensingParagraphs = ['fineract', 'distribution', 'legacy'] as const
  const licensingItems = [
    'howToLicense',
    'contributorAgreement',
    'licenseFaq',
    'externalSoftware',
    'codeOfConduct',
  ] as const

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('common:nav.system'), href: '/system' },
          { label: t('systemInformation.title'), current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 mt-6">
        <dl className="grid grid-cols-1 sm:grid-cols-[14rem_1fr] gap-y-4 text-sm text-zinc-700 dark:text-zinc-200">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="font-medium">{label}</dt>
              <dd className="text-zinc-600 dark:text-zinc-400 break-all">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-700 text-sm text-zinc-700 dark:text-zinc-200 space-y-4">
          <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
            {t('systemInformation.licensing.title')}
          </h2>
          {licensingParagraphs.map(key => (
            <p key={key}>
              <Trans
                i18nKey={`systemInformation.licensing.${key}`}
                ns="organization"
                components={licensingComponents}
              />
            </p>
          ))}
          <ul className="list-disc pl-6 space-y-2">
            {licensingItems.map(key => (
              <li key={key}>
                <Trans
                  i18nKey={`systemInformation.licensing.${key}`}
                  ns="organization"
                  components={licensingComponents}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default SystemInformation
