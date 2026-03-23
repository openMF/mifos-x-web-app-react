/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import fineract from '@/lib/axios'
import { faBuilding, faCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { getConfiguration } from '@/lib/fineract-openapi'
import { useTranslation } from 'react-i18next'
import {
  CentersApi,
  type CenterData,
  type GetCentersCenterIdResponse,
  type GetCentersTemplateResponse,
  type GetOfficesResponse,
} from '@/fineract-api'

interface CenterSummaryDetails {
  activeClients: number
  activeClientLoans: number
  activeClientBorrowers: number
  overdueGroupLoans: number
  overdueClientLoans: number
}

interface CenterProps {
  centerId: number
}

//For data conversion
const formatDate = (date: string, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))

const centerApi = new CentersApi(getConfiguration())

const CenterNavigation = ({ centerId }: CenterProps) => {
  //states to keep a record of the previous selections
  const [centerDetails, setCenterDetails] = useState<CenterData | null>(null)
  const [centerStatus, setCenterStatus] =
    useState<GetCentersCenterIdResponse | null>(null)
  const [template, setTemplate] = useState<GetCentersTemplateResponse | null>(
    null
  )
  const [centerSummary, setCenterSummary] =
    useState<CenterSummaryDetails | null>(null)
  const [office, setOffice] = useState<GetOfficesResponse | null>(null)
  const { t, i18n } = useTranslation('common')

  useEffect(() => {
    const fetchCenterData = async () => {
      try {
        const [detailRes, summaryRes] = await Promise.all([
          centerApi.retrieveOne14(centerId),
          fineract.get('/runreports/GroupSummaryCounts', {
            params: { R_groupId: centerId, genericResultSet: false },
          }),
        ])

        setCenterDetails(detailRes.data)
        setCenterStatus(detailRes.data)
        setTemplate(detailRes.data)
        setOffice(detailRes.data)
        if (Array.isArray(summaryRes.data) && summaryRes.data.length > 0) {
          setCenterSummary(summaryRes.data[0])
        } else {
          setCenterSummary(null)
        }
      } catch (err) {
        console.error('Error fetching center data:', err)
      }
    }

    fetchCenterData()
  }, [centerId])

  if (!centerDetails) {
    return <p className="text-gray-500">{t('navigation.loadingCenterInfo')}</p>
  }

  return (
    <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">
      {/* Header */}
      <div className="flex items-center gap-4">
        <FontAwesomeIcon
          icon={faBuilding}
          size="2x"
          className="text-gray-700 dark:text-gray-200"
        />
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            {centerDetails.name}
            <FontAwesomeIcon
              icon={faCircle}
              className={
                centerStatus?.status?.code === 'groupingStatusType.active'
                  ? 'text-green-500'
                  : 'text-gray-400'
              }
              title={centerStatus?.status?.description}
            />
          </h2>
          <p className="text-gray-500">
            {t('fields.accountNo')}:{' '}
            <span className="font-medium">{centerDetails.accountNo}</span>
          </p>
          {office?.externalId && (
            <p className="text-gray-500">
              {t('fields.externalId')}:{' '}
              <span className="font-medium">{office?.externalId}</span>
            </p>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-y-3">
        <div className="font-medium">{t('navigation.activationDate')}:</div>
        <div>{formatDate(template?.activationDate ?? '', i18n.language)}</div>

        <div className="font-medium">{t('navigation.associatedOfficer')}:</div>
        <div>{centerDetails.staffName || t('actions.na')}</div>

        {centerSummary && (
          <>
            <div className="font-medium">
              {t('navigation.numberOfActiveClients')}:
            </div>
            <div>{centerSummary.activeClients}</div>

            <div className="font-medium">
              {t('navigation.numberOfActiveClientLoans')}:
            </div>
            <div>{centerSummary.activeClientLoans}</div>

            <div className="font-medium">
              {t('navigation.numberOfActiveClientBorrowers')}:
            </div>
            <div>{centerSummary.activeClientBorrowers}</div>

            <div className="font-medium">
              {t('navigation.numberOfOverdueGroupLoans')}:
            </div>
            <div>{centerSummary.overdueGroupLoans}</div>

            <div className="font-medium">
              {t('navigation.numberOfOverdueClientLoans')}:
            </div>
            <div>{centerSummary.overdueClientLoans}</div>

            <div className="font-medium">{t('navigation.numberOfGroups')}:</div>
            <div>{centerSummary.overdueGroupLoans}</div>
          </>
        )}
      </div>
    </div>
  )
}

export default CenterNavigation
