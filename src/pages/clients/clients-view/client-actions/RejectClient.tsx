/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useTranslation } from 'react-i18next'
import PendingClientAction from './PendingClientAction'

/**
 * Rejects a pending client (POST /clients/{id}?command=reject), matching the
 * "Reject" action of the Angular web app.
 */
const RejectClient = () => {
  const { t } = useTranslation('clients')

  return (
    <PendingClientAction
      command="reject"
      dateField="rejectionDate"
      reasonField="rejectionReasonId"
      title={t('reject.title')}
      dateLabel={t('reject.labelRejectedOnDate')}
      reasonLabel={t('reject.labelRejectionReason')}
      selectReasonPlaceholder={t('reject.selectRejectionReason')}
      noReasonsFound={t('reject.noReasonsFound')}
      noReasonsAvailable={t('reject.noReasonsAvailable')}
      dateRequiredError={t('reject.errors.dateRequired')}
      dateInFutureError={t('reject.errors.dateInFuture')}
      dateBeforeSubmittedError={t('reject.errors.dateBeforeSubmitted')}
      reasonRequiredError={t('reject.errors.reasonRequired')}
      failedFetchReasonsError={t('reject.errors.failedFetchReasons')}
      cancelLabel={t('reject.cancel')}
      confirmLabel={t('reject.confirm')}
      failedSubmitError={t('errors.failedRejectClient')}
      successMessage={t('success.clientRejected')}
    />
  )
}

export default RejectClient
