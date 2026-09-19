/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useParams } from 'react-router-dom'

import EntityDocumentsTab from '@/components/documents/EntityDocumentsTab'

const SavingsDocumentsTab = () => {
  const { accountId } = useParams()

  return (
    <EntityDocumentsTab
      entityType="savings"
      entityId={accountId ? Number(accountId) : undefined}
    />
  )
}

export default SavingsDocumentsTab
