/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { useAccountBreadcrumbs } from '@/components/custom/breadcrumbs/accountBreadcrumbs'
import AppSelect from '@/components/custom/select/AppSelect'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  CodeValuesApi,
  CodesApi,
  SavingsAccountApi,
  SavingsAccountTransactionsApi,
} from '@/fineract-api'
import { useBusinessDateState } from '@/lib/business-date'
import { datatableErrorMessage } from '@/lib/datatables-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import NotFound from '@/pages/not-found/NotFound'

import {
  SAVINGS_ACTIONS,
  savingsAccountBasePath,
  savingsOwnerPath,
} from '../savings-account-menu'
import {
  EMPTY_COMMAND_VALUES,
  SAVINGS_COMMANDS,
  buildCommandPayload,
  canSubmitCommand,
  isConfirmOnly,
  isSavingsCommandAction,
  reasonForOptions,
  type SavingsCommandAction,
  type SavingsCommandValues,
} from './savings-commands'

const savingsApi = new SavingsAccountApi(getConfiguration())
const savingsTransactionsApi = new SavingsAccountTransactionsApi(
  getConfiguration()
)
const codesApi = new CodesApi(getConfiguration())
const codeValuesApi = new CodeValuesApi(getConfiguration())

type Option = { id: string; name: string }

/** Actions with no inputs; each has a confirm.<key> message. */
type ConfirmKey =
  | 'delete'
  | 'unblockAccount'
  | 'unblockDeposit'
  | 'unblockWithdrawal'
  | 'calculateInterest'
  | 'postInterest'

/** Active values of a Fineract code, such as SavingsAccountBlockReasons. */
async function fetchCodeValueNames(codeName: string): Promise<Option[]> {
  const codes = await codesApi.retrieveCodes()
  const code = (codes.data ?? []).find(c => c.name === codeName)
  if (!code?.id) return []
  const values = await codeValuesApi.retrieveAllCodeValues(code.id)
  return ((values.data ?? []) as Array<{ name?: string; active?: boolean }>)
    .filter(v => v.name && v.active !== false)
    .map(v => ({ id: v.name!, name: v.name! }))
}

const SavingsAccountCommand = () => {
  const { action, accountId } = useParams()
  if (!isSavingsCommandAction(action)) return <NotFound />
  // Remount per action and account so each form starts from its own defaults.
  return (
    <SavingsAccountCommandForm key={`${action}-${accountId}`} action={action} />
  )
}

const SavingsAccountCommandForm = ({
  action,
}: {
  action: SavingsCommandAction
}) => {
  const { t } = useTranslation('savings')
  const { accountId } = useParams()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const config = SAVINGS_COMMANDS[action]
  const key = SAVINGS_ACTIONS[action]
  const title = t(`menu.${key}`)
  const breadcrumbs = useAccountBreadcrumbs({ actionLabel: title })
  const confirmOnly = isConfirmOnly(config)

  const [values, setValues] =
    useState<SavingsCommandValues>(EMPTY_COMMAND_VALUES)
  // Starts at the business date, as in the Angular web app.
  const [date, setDate] = useBusinessDateState()

  const [reasons, setReasons] = useState<Option[]>([])
  const [paymentTypes, setPaymentTypes] = useState<Option[]>([])
  // Kept apart from the submit error, with a retry for the template request.
  const [paymentTypesFailed, setPaymentTypesFailed] = useState(false)
  const [paymentTypesAttempt, setPaymentTypesAttempt] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (patch: Partial<SavingsCommandValues>) => {
    setValues(prev => ({ ...prev, ...patch }))
    setError(null)
  }

  // Reasons come from the matching Fineract code, as in the Angular web app.
  // With no values configured, the reason is typed in instead.
  useEffect(() => {
    if (!config.reasonCode) return
    let active = true
    fetchCodeValueNames(config.reasonCode)
      .then(options => {
        if (!active) return
        setReasons(options)
        // A reason typed before the options loaded is not in the select, so
        // clear it rather than submit a value the form no longer shows.
        setValues(prev => {
          const reason = reasonForOptions(
            prev.reason,
            options.map(o => o.id)
          )
          return reason === prev.reason ? prev : { ...prev, reason }
        })
      })
      .catch(e => console.error('savings reason codes failed', e))
    return () => {
      active = false
    }
  }, [config.reasonCode])

  // Payment types for the withdrawal made when closing with "Withdraw balance".
  useEffect(() => {
    if (!config.close || !accountId) return
    let active = true
    setPaymentTypesFailed(false)
    savingsTransactionsApi
      .retrieveTemplate19(Number(accountId))
      .then(res => {
        const tpl = (res.data ?? {}) as {
          paymentTypeOptions?: Array<{ id?: number; name?: string }>
        }
        if (!active) return
        setPaymentTypes(
          (tpl.paymentTypeOptions ?? []).map(p => ({
            id: String(p.id ?? ''),
            name: p.name ?? '',
          }))
        )
      })
      .catch(e => {
        console.error('savings transaction template failed', e)
        if (active) setPaymentTypesFailed(true)
      })
    return () => {
      active = false
    }
  }, [config.close, accountId, paymentTypesAttempt])

  const accountPath = savingsAccountBasePath(pathname)
  const backToAccount = () =>
    accountPath ? navigate(`/${accountPath}/general`) : navigate(-1)

  const formValues = { ...values, date }
  const canSubmit = canSubmitCommand(config, formValues)

  const onSubmit = async () => {
    if (!accountId || !canSubmit) return
    const id = Number(accountId)
    const payload = buildCommandPayload(config, formValues)

    setSaving(true)
    setError(null)
    try {
      if (config.endpoint === 'delete') {
        await savingsApi.delete18(id)
      } else if (config.endpoint === 'transaction') {
        await savingsTransactionsApi.transaction2(id, payload, config.command)
      } else {
        await savingsApi.handleCommands6(id, payload, config.command)
      }
      const ownerPath = savingsOwnerPath(pathname)
      if (config.after === 'owner' && ownerPath) {
        navigate(`/${ownerPath}/general`)
      } else {
        backToAccount()
      }
    } catch (e) {
      console.error(`savings ${action} failed`, e)
      setError(datatableErrorMessage(e) ?? t('errors.failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <AppBreadCrumbs items={breadcrumbs} />

      <div className="max-w-3xl mx-auto">
        <div className="mt-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-8">
          <h2 className="text-2xl font-semibold mb-6">{title}</h2>

          <div className="space-y-6">
            {confirmOnly && (
              <p className="text-zinc-700 dark:text-zinc-300">
                {t(`confirm.${key as ConfirmKey}`)}
              </p>
            )}

            {config.dateField && (
              <div className="space-y-2">
                <Label htmlFor="savings-command-date">
                  {t(`fields.${config.dateField}`)}*
                </Label>
                <Input
                  id="savings-command-date"
                  type="date"
                  value={date}
                  onChange={e => {
                    setDate(e.target.value)
                    setError(null)
                  }}
                />
              </div>
            )}

            {config.amount && (
              <div className="space-y-2">
                <Label htmlFor="savings-command-amount">
                  {t('fields.amount')}*
                </Label>
                <Input
                  id="savings-command-amount"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={values.amount}
                  onChange={e => update({ amount: e.target.value })}
                />
              </div>
            )}

            {config.reasonCode && (
              <div className="space-y-2">
                {reasons.length > 0 ? (
                  <AppSelect
                    selectLabel={`${t('fields.reason')}*`}
                    selectValue={values.reason}
                    selectOnChange={reason => update({ reason })}
                    selectPlaceholder={t('fields.reasonPlaceholder')}
                    selectOptions={reasons}
                    selectClassname="w-full space-y-2"
                  />
                ) : (
                  <>
                    <Label htmlFor="savings-command-reason">
                      {t('fields.reason')}*
                    </Label>
                    <Input
                      id="savings-command-reason"
                      placeholder={t('fields.reasonFreeText')}
                      value={values.reason}
                      onChange={e => update({ reason: e.target.value })}
                    />
                  </>
                )}
              </div>
            )}

            {config.close && (
              <>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="savings-command-withdraw-balance"
                    checked={values.withdrawBalance}
                    onCheckedChange={v =>
                      update({ withdrawBalance: Boolean(v) })
                    }
                  />
                  <Label htmlFor="savings-command-withdraw-balance">
                    {t('fields.withdrawBalance')}
                  </Label>
                </div>
                {values.withdrawBalance && (
                  <AppSelect
                    selectLabel={`${t('fields.paymentType')}*`}
                    selectValue={values.paymentTypeId}
                    selectOnChange={paymentTypeId => update({ paymentTypeId })}
                    selectPlaceholder={t('fields.paymentTypePlaceholder')}
                    selectOptions={paymentTypes}
                    selectClassname="w-full space-y-2"
                  />
                )}
                {values.withdrawBalance && paymentTypesFailed && (
                  <div
                    role="alert"
                    className="flex items-center justify-between gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300"
                  >
                    <span>{t('errors.loadPaymentTypes')}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentTypesAttempt(n => n + 1)}
                    >
                      {t('buttons.retry')}
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="savings-command-interest-check"
                    checked={values.postInterestValidationOnClosure}
                    onCheckedChange={v =>
                      update({ postInterestValidationOnClosure: Boolean(v) })
                    }
                  />
                  <Label htmlFor="savings-command-interest-check">
                    {t('fields.postInterestValidationOnClosure')}
                  </Label>
                </div>
              </>
            )}

            {config.note && (
              <div className="space-y-2">
                <Label htmlFor="savings-command-note">{t('fields.note')}</Label>
                <Textarea
                  id="savings-command-note"
                  rows={3}
                  value={values.note}
                  onChange={e => update({ note: e.target.value })}
                />
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300"
              >
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={backToAccount}
                disabled={saving}
              >
                {t('buttons.cancel')}
              </Button>
              <Button
                className={
                  config.endpoint === 'delete'
                    ? ''
                    : 'bg-[#0e77b7] hover:bg-[#0662a3]'
                }
                variant={
                  config.endpoint === 'delete' ? 'destructive' : 'default'
                }
                onClick={onSubmit}
                disabled={!canSubmit || saving}
              >
                {confirmOnly ? t('buttons.confirm') : t('buttons.submit')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SavingsAccountCommand
