/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import EntityDocumentsTab from '@/components/documents/EntityDocumentsTab'

const ClientsDocumentsTab = () => {
  const { id } = useParams()
  const { t } = useTranslation('clients')

  return (
    <EntityDocumentsTab
      entityType="clients"
      entityId={id ? Number(id) : undefined}
      heading={t('documents.heading')}
    />
  )
}

export default ClientsDocumentsTab
