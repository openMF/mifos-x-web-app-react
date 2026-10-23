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
 * Withdraws a pending client application (POST /clients/{id}?command=withdraw),
 * matching the "Withdraw" action of the Angular web app.
 */
const WithdrawClient = () => {
  const { t } = useTranslation('clients')

  return (
    <PendingClientAction
      command="withdraw"
      dateField="withdrawalDate"
      reasonField="withdrawalReasonId"
      title={t('withdraw.title')}
      dateLabel={t('withdraw.labelWithdrawnOnDate')}
      reasonLabel={t('withdraw.labelWithdrawalReason')}
      selectReasonPlaceholder={t('withdraw.selectWithdrawalReason')}
      noReasonsFound={t('withdraw.noReasonsFound')}
      noReasonsAvailable={t('withdraw.noReasonsAvailable')}
      dateRequiredError={t('withdraw.errors.dateRequired')}
      dateInFutureError={t('withdraw.errors.dateInFuture')}
      dateBeforeSubmittedError={t('withdraw.errors.dateBeforeSubmitted')}
      reasonRequiredError={t('withdraw.errors.reasonRequired')}
      failedFetchReasonsError={t('withdraw.errors.failedFetchReasons')}
      cancelLabel={t('withdraw.cancel')}
      confirmLabel={t('withdraw.confirm')}
      failedSubmitError={t('errors.failedWithdrawClient')}
      successMessage={t('success.clientWithdrawn')}
    />
  )
}

export default WithdrawClient
